import { useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, FormattedDate } from 'react-intl';
import { AccordionSet, Accordion, Row, Col, KeyValue, Layer } from '@folio/stripes/components';
import MatchEditor from './MatchEditor';


function MatchingSummaryView({ data }) {
  const [showMatches, setShowMatches] = useState(false);
  const [matchType, setMatchType] = useState();
  const matchTitlesOfType = (key) => { setShowMatches(true); setMatchType(key); };

  const records = data.reportTitles;
  const categories = [
    { key: 'loaded', value: records.length },
    { key: 'matched', value: records.filter(r => r.kbTitleId).length },
    { key: 'unmatched', value: records.filter(r => !r.kbTitleId && !r.kbManualMatch).length },
    { key: 'ignored', value: records.filter(r => !r.kbTitleId && r.kbManualMatch).length },
  ];
  const nUnmatched = categories.filter(c => c.key === 'unmatched')[0].value;

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
            value={<FormattedMessage id={`ui-plugin-eusage-reports.matching-summary.status.${nUnmatched === 0 ? 'reviewed' : 'pending'}`} />}
          />
        </Col>
      </Row>

      <Row>
        {
          categories.map(cat => (
            <Col key={cat.key} xs={3} onClick={() => matchTitlesOfType(cat.key)} style={{ cursor: 'pointer' }}>
              <KeyValue
                label={<FormattedMessage id={`ui-plugin-eusage-reports.matching-summary.${cat.key}`} />}
                value={<span style={{ color: '#008', textDecoration: 'underline' }}>{cat.value}</span>}
              />
            </Col>
          ))
        }
      </Row>

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

        <Accordion closedByDefault label={`${data.titleData.length} title-data entries`}>
          <pre>
            {JSON.stringify(data.titleData, null, 2)}
          </pre>
        </Accordion>
      </AccordionSet>

      {
        showMatches &&
        <Layer isOpen contentLabel="Match editor">
          <MatchEditor matchType={matchType} onClose={() => setShowMatches(false)} />
        </Layer>
      }
    </>
  );
}


MatchingSummaryView.propTypes = {
  data: PropTypes.shape({
    counterReports: PropTypes.arrayOf(
      PropTypes.object.isRequired, // XXX tighten up
    ),
    usageDataProvider: PropTypes.shape({
      harvestingDate: PropTypes.string,
    }).isRequired,
    reportTitles: PropTypes.arrayOf(
      PropTypes.object.isRequired, // XXX tighten up
    ),
    titleData: PropTypes.arrayOf(
      PropTypes.object.isRequired, // XXX tighten up
    ),
  }).isRequired,
};


export default MatchingSummaryView;
