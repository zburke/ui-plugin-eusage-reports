import PropTypes from 'prop-types';
import { stripesConnect } from '@folio/stripes/core';
import MatchingSummaryView from '../components/MatchingSummaryView';


function MatchingSummaryLoader({ data, resources, mutator }) {
  // We would like to determine whether the 'reportTitles' resource
  // has loaded just by looking at resources.reportTitles.hasLoaded,
  // but when that has once become true, it remains forever true, even
  // after the UDB changes and a new data-set needs to be loaded.
  const hasLoaded = (resources.reportTitles.url || '').includes(data.usageDataProvider.id);

  return <MatchingSummaryView
    hasLoaded={hasLoaded}
    data={{
      ...data,
      query: resources.query,
      reportTitles: resources.reportTitles.records,
      reportTitlesCount: resources.reportTitles.other?.totalRecords,
    }}
    mutator={mutator}
  />;
}


MatchingSummaryLoader.manifest = {
  query: {},
  reportTitles: {
    type: 'okapi',
    path: 'eusage-reports/report-titles',
    params: (_q, _p, _r, _l, props) => {
      const params = { limit: 200 };
      const udpId = props.data.usageDataProvider.id;
      if (udpId) params.providerId = udpId;
      return params;
    },
    records: 'titles',
  },
  updateReportTitles: {
    type: 'okapi',
    path: 'eusage-reports/report-titles',
    fetch: false,
    throwErrors: false,
  },
};


MatchingSummaryLoader.propTypes = {
  data: PropTypes.shape({
    usageDataProvider: PropTypes.shape({
      id: PropTypes.string,
    }).isRequired,
  }).isRequired,
  resources: PropTypes.shape({
    reportTitles: PropTypes.shape({
      url: PropTypes.string,
      records: PropTypes.arrayOf(
        PropTypes.object.isRequired,
      ),
      other: PropTypes.shape({
        totalRecords: PropTypes.number.isRequired,
      }),
    }).isRequired,
    query: PropTypes.object.isRequired,
  }).isRequired,
  mutator: PropTypes.object.isRequired,
};


export default stripesConnect(MatchingSummaryLoader);
