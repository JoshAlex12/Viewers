import { utils } from '@ohif/core';

/**
 * Generates a URL that can be used for direct retrieve of the bulkdata
 *
 * @param {object} params
 * @param {string} params.tag is the tag name of the URL to retrieve
 * @param {string} params.defaultPath path for the pixel data url
 * @param {object} params.instance is the instance object that the tag is in
 * @param {string} params.defaultType is the mime type of the response
 * @param {string} params.singlepart is the type of the part to retrieve
 * @param {string} params.fetchPart unknown?
 * @param {string} params.url unknown?
 * @returns an absolute URL to the resource, if the absolute URL can be retrieved as singlepart,
 *    or is already retrieved, or a promise to a URL for such use if a BulkDataURI
 */
const getDirectURL = (config, params) => {
  const { wadoRoot, singlepart } = config;
  const {
    instance,
    tag = 'PixelData',
    defaultPath = '/pixeldata',
    defaultType = 'video/mp4',
    singlepart: fetchPart = 'video',
    url = null,
  } = params;
  if (url) {
    return url;
  }

  const value = instance[tag];
  if (!value) {
      return createRenderedRetrieve(config, params) || getBulkdataValue(config, params);
  }

  if (value.DirectRetrieveURL) {
    return value.DirectRetrieveURL;
  }
  if (value.InlineBinary) {
    const blob = utils.b64toBlob(value.InlineBinary, defaultType);
    value.DirectRetrieveURL = URL.createObjectURL(blob);
    return value.DirectRetrieveURL;
  }
  if (!singlepart || (singlepart !== true && singlepart.indexOf(fetchPart) === -1)) {
    if (value.retrieveBulkData) {
      // Try the specified retrieve type.
      const options = {
        mediaType: defaultType,
      };
      return value.retrieveBulkData(options).then(arr => {
        value.DirectRetrieveURL = URL.createObjectURL(new Blob([arr], { type: defaultType }));
        return value.DirectRetrieveURL;
      });
    }
    console.warn('Unable to retrieve', tag, 'from', instance);
    return undefined;
  }

  const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = instance;
  const BulkDataURI =
    value?.BulkDataURI || `series/${SeriesInstanceUID}/instances/${SOPInstanceUID}${defaultPath}`;
  const hasQuery = BulkDataURI.indexOf('?') !== -1;
  const hasAccept = BulkDataURI.indexOf('accept=') !== -1;
  const acceptUri =
    BulkDataURI + (hasAccept ? '' : (hasQuery ? '&' : '?') + `accept=${defaultType}`);

  if ((tag === 'PixelData' || tag === 'EncapsulatedDocument') && !hasQuery) {
  // Only return the default path if it doesn't have the query
    return `${wadoRoot}/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/instances/${SOPInstanceUID}/rendered`;
  }

  if (acceptUri.startsWith('series')) {
    // Use a relative path for series level retrieves when they contain a query
    // parameter - that is used to assume it has provided the correct overall URL.
    return `${wadoRoot}/studies/${StudyInstanceUID}/${acceptUri}`;
  }

  // The DICOMweb standard states that the default is multipart related, and then
  // separately states that the accept parameter is the URL parameter equivalent of the accept header.
  return acceptUri;
};

export default getDirectURL;
