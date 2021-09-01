import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl, FormattedMessage } from 'react-intl';
import { Bar } from 'react-chartjs-2';
import { useStripes } from '@folio/stripes/core';
import { Loading, Accordion } from '@folio/stripes/components';
import transformReqByPubYearData from '../../util/transformRBPY';


function renderRequestsByPublicationYearChart(intl, data) {
  const options = {
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
        },
      ],
      x: {
        stacked: true,
      },
      y: {
        stacked: true
      },
    },
    animation: false,
    stacked: true,
    maintainAspectRatio: false,
  };

  return (
    <div style={{ resize: 'vertical', overflow: 'scroll' }}>
      <Bar
        redraw
        data={data}
        height={400}
        options={options}
      />
    </div>
  );
}


function RequestsByPublicationYear({ params, hasLoaded, data }) {
  const intl = useIntl();
  const stripes = useStripes();
  const rbpy = data.requestsByPublicationYear;
  const countType = params.countType === 'total' ? 'Total_Item_Requests' : 'Unique_Item_Requests';
  const transformed = useMemo(() => transformReqByPubYearData(rbpy, countType), [rbpy, countType]);
  if (!hasLoaded) return <><br /><Loading /><br /></>;

  return (
    <>
      {renderRequestsByPublicationYearChart(intl, transformed)}
      {stripes.config.showDevInfo &&
        <Accordion closedByDefault label={<FormattedMessage id="ui-plugin-eusage-reports.useOverTime.raw-data" />}>
          <pre>{JSON.stringify(rbpy, null, 2)}</pre>
        </Accordion>
      }
    </>
  );
}


RequestsByPublicationYear.propTypes = {
  params: PropTypes.shape({
    countType: PropTypes.string.isRequired,
  }).isRequired,
  hasLoaded: PropTypes.bool.isRequired,
  data: PropTypes.shape({
    requestsByPublicationYear: PropTypes.shape({
      // XXX
    }),
  }),
};


export default RequestsByPublicationYear;
