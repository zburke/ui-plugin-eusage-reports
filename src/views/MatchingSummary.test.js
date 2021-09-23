import React from 'react';
import { IntlProvider } from 'react-intl';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { useOkapiKy, CalloutContext } from '@folio/stripes/core';
import reportTitles from '../../test/jest/data/reportTitles';
import MatchingSummary from './MatchingSummary';
import rawTranslations from '../../translations/ui-plugin-eusage-reports/en';

const translations = {};
Object.keys(rawTranslations).forEach(key => {
  translations[`ui-plugin-eusage-reports.${key}`] = rawTranslations[key];
});


// Empirically, this has to be done at the top level, not within the test. No-one knows why
// See https://folio-project.slack.com/archives/C210UCHQ9/p1632425791183300?thread_ts=1632350696.158900&cid=C210UCHQ9
useOkapiKy.mockReturnValue({
  post: (_path) => {
    // console.log('*** mocked okapiKy POST to', _path);
    return new Promise((resolve, _reject) => {
      // console.log('*** mocked okapiKy resolving promise');
      resolve({ status: 'ok' });
    });
  },
});


const renderMatchingSummary = () => {
  const queryData = { matchType: undefined };
  const callout = {
    sendCallout: (_calloutData) => {
      // console.log('*** sendCallout:', _calloutData.message.props.id);
    }
  };

  return render(
    <CalloutContext.Provider value={callout}>
      <IntlProvider locale="en-US" messages={translations}>
        <MatchingSummary
          hasLoaded
          data={{
            query: queryData,
            counterReports: [],
            usageDataProvider: {
              harvestingDate: '2021-09-22T20:26:29.995390',
            },
            reportTitles,
            reportTitlesCount: 42,
          }}
          mutator={{
            query: {
              update: (newData) => Object.assign(queryData, newData),
            },
          }}
          reloadReportTitles={
            () => undefined
          }
        />
      </IntlProvider>
    </CalloutContext.Provider>
  );
};


describe('Matching Summary page', () => {
  let node;

  beforeEach(() => {
    node = renderMatchingSummary();
  });

  afterEach(cleanup);

  it('should be rendered', async () => {
    const { container } = node;
    const content = container.querySelector('[data-test-matching-summary]');
    expect(container).toBeVisible();
    expect(content).toBeVisible();

    // Harvesting date and status
    // XXX We should check for values associated with keys:
    // See https://folio-project.slack.com/archives/C210UCHQ9/p1632414298168000?thread_ts=1632407596.164700&cid=C210UCHQ9
    expect(screen.getByText('9/22/2021')).toBeVisible(); // US formatting
    expect(screen.getByText('Pending review')).toBeVisible(); // Because some records are unmatched

    // Counts of records in various categories
    expect(screen.getByText('Records loaded')).toBeVisible();
    expect(screen.getByText('4 of 42')).toBeVisible();

    // Check and click update-matches button
    expect(screen.getByRole('button')).toHaveTextContent('Update matches');
    expect(screen.getByRole('button')).toBeEnabled();

    fireEvent.click(screen.getByRole('button'));
    // XXX The callout mock renders nothing on screen for us to wait for
    // await waitFor(() => screen.getByText('Requested update'));
  });
});
