import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Loading, MultiColumnList, Accordion } from '@folio/stripes/components';


function UseOverTime({ data }) {
  const uot = data.useOverTime;
  if (!uot) return <><br /><Loading /><br /></>;

  const dates = uot.accessCountPeriods;

  const tirByDate = {};
  dates.forEach((date, i) => {
    tirByDate[date] = uot.totalItemRequestsByPeriod[i];
  });

  const uirByDate = {};
  dates.forEach((date, i) => {
    uirByDate[date] = uot.uniqueItemRequestsByPeriod[i];
  });

  const pointlessFormattersForDateColumns = {};
  dates.forEach(date => {
    // We need these because MCL throws a hissy-fit if it sees an undefined value
    pointlessFormattersForDateColumns[date] = (x) => x[date] || '';
  });

  const dataLines = uot.items.map(item => {
    const rec = {
      title: item.title,
      accessType: <FormattedMessage id={`ui-plugin-eusage-reports.useOverTime.access.${item.accessType}`} />,
      metricType: <FormattedMessage id={`ui-plugin-eusage-reports.useOverTime.metric.${item.metricType}`} />,
    };

    dates.forEach((date, i) => {
      rec[date] = item.accessCountsByPeriod[i];
    });

    return rec;
  });

  const dataSet = [
    {
      title: <b><FormattedMessage id="ui-plugin-eusage-reports.useOverTime.totalItemRequests" /></b>,
      accessType: undefined,
      metricType: undefined,
      ...tirByDate,
    },
    {
      title: <b><FormattedMessage id="ui-plugin-eusage-reports.useOverTime.uniqueItemRequests" /></b>,
      accessType: undefined,
      metricType: undefined,
      ...uirByDate,
    },
    ...dataLines,
  ];

  return (
    <>
      <p>
        <b><FormattedMessage id="ui-plugin-eusage-reports.useOverTime.totalTotalItemRequests" /></b>
        {': '}
        {uot.totalItemRequestsTotal}
      </p>
      <p>
        <b><FormattedMessage id="ui-plugin-eusage-reports.useOverTime.totalUniqueItemRequests" /></b>
        {': '}
        {uot.uniqueItemRequestsTotal}
      </p>

      <MultiColumnList
        contentData={dataSet}
        visibleColumns={['title', 'accessType', 'metricType', ...dates]}
        columnMapping={{
          title: <FormattedMessage id="ui-plugin-eusage-reports.useOverTime.column.title" />,
          accessType: <FormattedMessage id="ui-plugin-eusage-reports.useOverTime.column.accessType" />,
          metricType: <FormattedMessage id="ui-plugin-eusage-reports.useOverTime.column.metricType" />,
        }}
        columnWidths={{
          title: '150px',
          accessType: '150px',
          metricType: '150px',
        }}
        formatter={{
          ...pointlessFormattersForDateColumns,
        }}
      />

      <Accordion closedByDefault label="use-over-time data">
        <pre>
          {JSON.stringify(uot, null, 2)}
        </pre>
      </Accordion>
    </>
  );
}


UseOverTime.propTypes = {
  data: PropTypes.shape({
    useOverTime: PropTypes.shape({
      totalItemRequestsTotal: PropTypes.number.isRequired,
      uniqueItemRequestsTotal: PropTypes.number.isRequired,
      accessCountPeriods: PropTypes.arrayOf(
        PropTypes.string.isRequired,
      ).isRequired,
      totalItemRequestsByPeriod: PropTypes.arrayOf(
        PropTypes.string.isRequired,
      ).isRequired,
      uniqueItemRequestsByPeriod: PropTypes.arrayOf(
        PropTypes.string.isRequired,
      ).isRequired,
    }).isRequired,
  }),
};


export default UseOverTime;
