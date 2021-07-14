import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, FormattedDate } from 'react-intl';
import { useStripes, useOkapiKy, CalloutContext } from '@folio/stripes/core';
import { AccordionSet, Accordion, Row, Col, KeyValue, Loading, Layer, Button } from '@folio/stripes/components';
import MatchEditorLoader from '../loaders/MatchEditorLoader';
import generateTitleCategories from '../util/generateTitleCategories';
import displayError from '../util/displayError';
import performLongOperation from '../util/performLongOperation';


const displayUpdateMatchError = (c, t, m) => displayError(c, 'button.update-matches.error', t, m);


function extractMostRecentSegment(callout, counterReports) {
  let mostRecentReport;
  counterReports.forEach(counterReport => {
    if (!mostRecentReport || counterReport.year > mostRecentReport.year) {
      mostRecentReport = counterReport;
    }
  });

  if (!mostRecentReport) {
    return displayUpdateMatchError(callout, 'no-recent-report');
  }

  let trReport;
  mostRecentReport.reportsPerType.forEach(report => {
    if (report.reportType === 'TR') {
      trReport = report;
    }
  });

  if (!trReport) {
    return displayUpdateMatchError(callout, 'no-tr-report');
  }

  let mostRecentSegment;
  trReport.counterReports.forEach(segment => {
    if (!mostRecentSegment || segment.yearMonth > mostRecentSegment.yearMonth) {
      mostRecentSegment = segment;
    }
  });

  if (!mostRecentSegment) {
    return displayUpdateMatchError(callout, 'no-segment');
  }

  return mostRecentSegment;
}


function updateMatches(okapiKy, callout, data, reloadReportTitles) {
  const mostRecentSegment = extractMostRecentSegment(callout, data.counterReports);
  if (mostRecentSegment) {
    performLongOperation(okapiKy, callout,
      'update-matches',
      'eusage-reports/report-titles/from-counter',
      { counterReportId: mostRecentSegment.id },
      { yearMonth: mostRecentSegment.yearMonth },
      reloadReportTitles);
  }
}


function MatchingSummaryView({ hasLoaded, data, mutator, reloadReportTitles }) {
  const stripes = useStripes();
  const okapiKy = useOkapiKy();
  const callout = useContext(CalloutContext);

  const matchType = data.query.matchType;
  const matchTitlesOfType = (key) => mutator.query.update({ matchType: key });

  const categories = generateTitleCategories(data.reportTitles);
  const nUnmatched = categories.filter(c => c.key === 'unmatched')[0].data.length;
  const status = nUnmatched > 0 ? 'pending' : data.reportTitles.length > 0 ? 'reviewed' : 'no-records';

  const pluginPaneTitleRef = React.useRef();
  const focusHandler = () => {
    // eslint-disable-next-line no-unused-expressions
    pluginPaneTitleRef.current?.focus();
  };

  return (
    <>
      <Row>
        <Col xs={3}>
          <KeyValue
            label={<FormattedMessage id="ui-plugin-eusage-reports.matching-summary.date-of-last-harvest" />}
            value={<FormattedDate value={data.usageDataProvider.harvestingDate} />}
          />
        </Col>
        <Col xs={3}>
          <KeyValue
            label={<FormattedMessage id="ui-plugin-eusage-reports.matching-summary.status" />}
            value={
              hasLoaded ?
                <FormattedMessage id={`ui-plugin-eusage-reports.matching-summary.status.${status}`} /> :
                <Loading />
            }
          />
        </Col>
      </Row>

      <Row>
        {
          categories.map(cat => (
            <Col key={cat.key} xs={3} onClick={() => matchTitlesOfType(cat.key)} style={{ cursor: 'pointer' }}>
              <KeyValue
                label={<FormattedMessage id={`ui-plugin-eusage-reports.matching-summary.${cat.key}`} />}
                value={
                  hasLoaded ?
                    <span style={{ color: '#008', textDecoration: 'underline' }}>
                      {
                        (cat.key !== 'loaded' || cat.data.length === data.reportTitlesCount) ?
                          cat.data.length :
                          `${cat.data.length} of ${data.reportTitlesCount}`
                      }
                    </span> :
                    <Loading />
                }
              />
            </Col>
          ))
        }
      </Row>

      <Button onClick={() => updateMatches(okapiKy, callout, data, reloadReportTitles)}>
        <FormattedMessage id="ui-plugin-eusage-reports.button.update-matches" />
      </Button>

      {stripes.config.showDevInfo &&
        <>
          <hr />
          <AccordionSet>
            <Accordion closedByDefault label={`${data.counterReports.length} COUNTER Reports`}>
              <pre>
                {JSON.stringify(data.counterReports, null, 2)}
              </pre>
            </Accordion>

            <Accordion closedByDefault label={`${data.reportTitles.length} report titles`}>
              <pre>
                {JSON.stringify(data.reportTitles, null, 2)}
              </pre>
            </Accordion>
          </AccordionSet>
        </>
      }

      {
        data.query.matchType &&
        <Layer isOpen contentLabel="Match editor" afterOpen={focusHandler}>
          <MatchEditorLoader
            onClose={() => matchTitlesOfType(null)}
            matchType={matchType}
            data={data}
            mutator={mutator}
            paneTitleRef={pluginPaneTitleRef}
          />
        </Layer>
      }
    </>
  );
}


MatchingSummaryView.propTypes = {
  hasLoaded: PropTypes.bool.isRequired,
  data: PropTypes.shape({
    query: PropTypes.object.isRequired,
    counterReports: PropTypes.arrayOf(
      PropTypes.object.isRequired,
    ),
    usageDataProvider: PropTypes.shape({
      harvestingDate: PropTypes.string,
    }).isRequired,
    reportTitles: PropTypes.arrayOf(
      PropTypes.shape({
        kbTitleId: PropTypes.string,
        kbManualMatch: PropTypes.bool.isRequired,
      }).isRequired,
    ).isRequired,
    reportTitlesCount: PropTypes.number,
  }).isRequired,
  mutator: PropTypes.shape({
    query: PropTypes.shape({
      update: PropTypes.func.isRequired,
    }).isRequired,
  }).isRequired,
  reloadReportTitles: PropTypes.func.isRequired,
};


export default MatchingSummaryView;
