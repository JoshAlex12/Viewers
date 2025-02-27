import React from 'react';
import { StudySummaryFromMetadata } from './StudySummaryFromMetadata';
import StudyMeasurementMenu from './StudyMeasurementMenu';

export default function StudySummaryMenu(props) {
  return (
    <div>
      <StudySummaryFromMetadata {...props} />
      <StudyMeasurementMenu {...props} />
    </div>
  );
}
