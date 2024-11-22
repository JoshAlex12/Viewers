import { metaData, utilities } from '@cornerstonejs/core';

import OHIF, { DicomMetadataStore, utils } from '@ohif/core';
import dcmjs from 'dcmjs';
import { adaptersSR } from '@cornerstonejs/adapters';
import { showLabelAnnotationPopup, colorPickerDialog } from '@ohif/extension-default';

import getFilteredCornerstoneToolState from './utils/getFilteredCornerstoneToolState';

const { MeasurementReport } = adaptersSR.Cornerstone3D;
const { log } = OHIF;

/**
 * @param measurementData An array of measurements from the measurements service
 * that you wish to serialize.
 * @param additionalFindingTypes toolTypes that should be stored with labels as Findings
 * @param options Naturalized DICOM JSON headers to merge into the displaySet.
 *
 */
const _generateReport = (measurementData, additionalFindingTypes, options = {}) => {
  const filteredToolState = getFilteredCornerstoneToolState(
    measurementData,
    additionalFindingTypes
  );

  const report = MeasurementReport.generateReport(
    filteredToolState,
    metaData,
    utilities.worldToImageCoords,
    options
  );

  const { dataset } = report;

  // Set the default character set as UTF-8
  // https://dicom.innolitics.com/ciods/nm-image/sop-common/00080005
  if (typeof dataset.SpecificCharacterSet === 'undefined') {
    dataset.SpecificCharacterSet = 'ISO_IR 192';
  }
  return dataset;
};

const commandsModule = (props: withAppTypes) => {
  const { servicesManager } = props;
  const { customizationService, measurementService, viewportGridService, uiDialogService } =
    servicesManager.services;
  const actions = {
    changeColorMeasurement: ({ uid }) => {
      // When this gets supported, it probably belongs in cornerstone, not sr
      throw new Error('Unsupported operation: changeColorMeasurement');
      // const { color } = measurementService.getMeasurement(uid);
      // const rgbaColor = {
      //   r: color[0],
      //   g: color[1],
      //   b: color[2],
      //   a: color[3] / 255.0,
      // };
      // colorPickerDialog(uiDialogService, rgbaColor, (newRgbaColor, actionId) => {
      //   if (actionId === 'cancel') {
      //     return;
      //   }

      //   const color = [newRgbaColor.r, newRgbaColor.g, newRgbaColor.b, newRgbaColor.a * 255.0];
      // segmentationService.setSegmentColor(viewportId, segmentationId, segmentIndex, color);
      // });
    },

    /**
     *
     * @param measurementData An array of measurements from the measurements service
     * @param additionalFindingTypes toolTypes that should be stored with labels as Findings
     * @param options Naturalized DICOM JSON headers to merge into the displaySet.
     * as opposed to Finding Sites.
     * that you wish to serialize.
     */
    downloadReport: ({ measurementData, additionalFindingTypes, options = {} }) => {
      const srDataset = actions.generateReport(measurementData, additionalFindingTypes, options);
      const reportBlob = dcmjs.data.datasetToBlob(srDataset);

      //Create a URL for the binary.
      const objectUrl = URL.createObjectURL(reportBlob);
      window.location.assign(objectUrl);
    },

    /**
     * Download the CSV report for the measurements.
     */
    downloadCSVMeasurementsReport: ({ measurementFilter }) => {
      utils.downloadCSVReport(measurementService.getMeasurements(measurementFilter));
    },

    /**
     *
     * @param measurementData An array of measurements from the measurements service
     * that you wish to serialize.
     * @param dataSource The dataSource that you wish to use to persist the data.
     * @param additionalFindingTypes toolTypes that should be stored with labels as Findings
     * @param options Naturalized DICOM JSON headers to merge into the displaySet.
     * @return The naturalized report
     */
    storeMeasurements: async ({
      measurementData,
      dataSource,
      additionalFindingTypes,
      options = {},
    }) => {
      // Use the @cornerstonejs adapter for converting to/from DICOM
      // But it is good enough for now whilst we only have cornerstone as a datasource.
      log.info('[DICOMSR] storeMeasurements');

      if (!dataSource || !dataSource.store || !dataSource.store.dicom) {
        log.error('[DICOMSR] datasource has no dataSource.store.dicom endpoint!');
        return Promise.reject({});
      }

      try {
        const naturalizedReport = _generateReport(measurementData, additionalFindingTypes, options);

        const { StudyInstanceUID, ContentSequence } = naturalizedReport;
        // The content sequence has 5 or more elements, of which
        // the `[4]` element contains the annotation data, so this is
        // checking that there is some annotation data present.
        if (!ContentSequence?.[4].ContentSequence?.length) {
          console.log('naturalizedReport missing imaging content', naturalizedReport);
          throw new Error('Invalid report, no content');
        }

        const onBeforeDicomStore =
          customizationService.getModeCustomization('onBeforeDicomStore')?.value;

        let dicomDict;
        if (typeof onBeforeDicomStore === 'function') {
          dicomDict = onBeforeDicomStore({ measurementData, naturalizedReport });
        }

        await dataSource.store.dicom(naturalizedReport, null, dicomDict);

        if (StudyInstanceUID) {
          dataSource.deleteStudyMetadataPromise(StudyInstanceUID);
        }

        // The "Mode" route listens for DicomMetadataStore changes
        // When a new instance is added, it listens and
        // automatically calls makeDisplaySets
        DicomMetadataStore.addInstances([naturalizedReport], true);

        return naturalizedReport;
      } catch (error) {
        console.warn(error);
        log.error(`[DICOMSR] Error while saving the measurements: ${error.message}`);
        throw new Error(error.message || 'Error while saving the measurements.');
      }
    },
  };

  const definitions = {
    downloadReport: {
      commandFn: actions.downloadReport,
    },
    storeMeasurements: {
      commandFn: actions.storeMeasurements,
    },
    downloadCSVMeasurementsReport: {
      commandFn: actions.downloadCSVMeasurementsReport,
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'CORNERSTONE_STRUCTURED_REPORT',
  };
};

export default commandsModule;
