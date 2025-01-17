import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl, FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { useOkapiKy, AppIcon, CalloutContext, Pluggable } from '@folio/stripes/core';
import {
  HasCommand,
  Paneset,
  Pane,
  Layout,
  ButtonGroup,
  Button,
  MultiColumnList,
  Dropdown,
  IconButton,
  DropdownMenu,
  LoadingPane,
} from '@folio/stripes/components';
import { SearchAndSortQuery } from '@folio/stripes/smart-components';


function maybeLinkTitle(rec) {
  const kbId = rec.kbTitleId;

  if (!kbId) return rec.kbTitleName;
  return (
    <Link to={`/erm/eresources/${kbId}`}>
      {rec.kbTitleName}
    </Link>
  );
}


function calculateStatus(intl, rec) {
  if (rec.kbTitleId) {
    return intl.formatMessage({ id: 'ui-plugin-eusage-reports.matching-summary.matched' });
  } else if (rec.kbManualMatch) {
    return intl.formatMessage({ id: 'ui-plugin-eusage-reports.matching-summary.ignored' });
  } else {
    return <b>{intl.formatMessage({ id: 'ui-plugin-eusage-reports.matching-summary.unmatched' })}</b>;
  }
}


function mutateAndReport(callout, okapiKy, rec, tag, triggerReRender, reportTitles) {
  delete rec.rowIndex;

  okapiKy('eusage-reports/report-titles', {
    method: 'POST',
    json: { titles: [rec] }
  })
    .then(() => {
      // Update the copy of the record that was loaded from the WSAPI
      reportTitles.forEach((rt, index) => {
        if (rt.id === rec.id) reportTitles[index] = rec;
      });

      triggerReRender();
      callout.sendCallout({
        message: <FormattedMessage
          id={`ui-plugin-eusage-reports.action.${tag}`}
          values={{ title: rec.counterReportTitle, i: x => <i>{x}</i> }}
        />
      });
    }).catch(err => {
      callout.sendCallout({
        type: 'error',
        message: <FormattedMessage
          id={`ui-plugin-eusage-reports.action.not-${tag}`}
          values={{ error: err.toString() }}
        />
      });
    });
}


function handleIgnore(callout, okapiKy, rec, triggerReRender, reportTitles) {
  const ignored = rec.kbManualMatch && !rec.kbTitleId;

  if (ignored) {
    // Stop ignoring
    rec.kbManualMatch = false;
  } else {
    // Ignore
    rec.kbManualMatch = true;
    rec.kbTitleId = undefined;
    rec.kbTitleName = undefined;
  }

  mutateAndReport(callout, okapiKy, rec, ignored ? 'unignored' : 'ignored', triggerReRender, reportTitles);
}


function onEresourceSelected(callout, okapiKy, rec, agreement, setRecordToEdit, triggerReRender, reportTitles) {
  rec.kbManualMatch = true;
  rec.kbTitleId = agreement.id;
  rec.kbTitleName = agreement.name;

  mutateAndReport(callout, okapiKy, rec, 'edited', triggerReRender, reportTitles);
  setRecordToEdit(undefined);
}


function actionMenu(intl, callout, okapiKy, rec, setRecordToEdit, triggerReRender, reportTitles) {
  const ignored = rec.kbManualMatch && !rec.kbTitleId;
  const actionLabel = intl.formatMessage({ id: 'ui-plugin-eusage-reports.column.action' });

  return (
    <Dropdown
      id={`menu-${rec.id}`}
      renderTrigger={({ getTriggerProps }) => (
        <IconButton
          {...getTriggerProps()}
          icon="ellipsis"
          aria-label={actionLabel}
        />
      )}
      renderMenu={({ onToggle }) => (
        <DropdownMenu role="menu" aria-label={actionLabel}>
          <Button
            role="menuitem"
            buttonStyle="dropdownItem"
            data-test-dropdown-edit
            onClick={() => { onToggle(); setRecordToEdit(rec); }}
          >
            <FormattedMessage id="ui-plugin-eusage-reports.action.edit" />
          </Button>
          <Button
            role="menuitem"
            buttonStyle="dropdownItem"
            data-test-dropdown-ignore
            onClick={() => { onToggle(); handleIgnore(callout, okapiKy, rec, triggerReRender, reportTitles); }}
          >
            <FormattedMessage id={`ui-plugin-eusage-reports.action.${ignored ? 'unignore' : 'ignore'}`} />
          </Button>
        </DropdownMenu>
      )}
    />
  );
}


function MatchEditor({ matchType, onClose, data, source, onNeedMoreData, mutator, paneTitleRef }) {
  const intl = useIntl();
  const categories = data.categories;
  const callout = useContext(CalloutContext);
  const okapiKy = useOkapiKy();
  const [recordToEdit, setRecordToEdit] = useState();
  const [ignoredAdditionalPropToTriggerReRender, setIgnoredAdditionalPropToTriggerReRender] = useState(false);
  const triggerReRender = () => setIgnoredAdditionalPropToTriggerReRender(!ignoredAdditionalPropToTriggerReRender);
  const count = source ? source.totalCount() : 0;

  return (
    <HasCommand commands={[{ name: 'close', handler: onClose }]}>
      <Paneset isRoot data-test-match-editor>
        <Pane
          appIcon={<AppIcon app="erm-usage" />}
          defaultWidth="fill"
          dismissible
          onClose={onClose}
          paneTitle={<FormattedMessage
            id="ui-plugin-eusage-reports.matching-summary.matcher-heading"
            values={{ label: data.usageDataProvider.label }}
          />}
          paneTitleRef={paneTitleRef}
        >
          {recordToEdit &&
            <Pluggable
              type="find-eresource"
              defaultOpen
              renderTrigger={() => <LoadingPane />}
              onClose={() => setRecordToEdit(undefined)}
              onEresourceSelected={(agreement) => onEresourceSelected(callout, okapiKy, recordToEdit, agreement, setRecordToEdit, triggerReRender, data.reportTitles)}
              modalLabel={
                <FormattedMessage
                  id="ui-plugin-eusage-reports.select-eresource"
                  values={{ title: recordToEdit.counterReportTitle, i: x => <i>{x}</i> }}
                />
              }
            >
              <FormattedMessage id="ui-plugin-eusage-reports.action.no-agreement-plugin" />
            </Pluggable>
          }

          <Layout className="textCentered">
            <ButtonGroup>
              {
                categories.map(cat => (
                  <Button
                    key={cat.key}
                    buttonStyle={`${cat.key === matchType ? 'primary' : 'default'}`}
                    id={`segment-category-${cat.key}`}
                    onClick={() => mutator.query.update({ matchType: cat.key })}
                  >
                    <FormattedMessage
                      id={`ui-plugin-eusage-reports.matching-summary.${cat.key}-count`}
                      values={{ count: cat.count }}
                    />
                  </Button>
                ))
              }
            </ButtonGroup>
          </Layout>

          <SearchAndSortQuery initialSearchState={{ query: '' }}>
            {
              (sasqParams) => {
                return (
                  <MultiColumnList
                    id="list-title-matches"
                    virtualize
                    visibleColumns={['counterReportTitle', 'kbTitleName', 'isbn', 'issn', 'eissn', 'doi', 'status', 'action']}
                    columnMapping={{
                      id: <FormattedMessage id="ui-plugin-eusage-reports.column.id" />,
                      counterReportTitle: <FormattedMessage id="ui-plugin-eusage-reports.column.counterReportTitle" />,
                      kbTitleName: <FormattedMessage id="ui-plugin-eusage-reports.column.kbTitleName" />,
                      kbTitleId: <FormattedMessage id="ui-plugin-eusage-reports.column.kbTitleId" />,
                      isbn: <FormattedMessage id="ui-plugin-eusage-reports.column.isbn" />,
                      issn: <FormattedMessage id="ui-plugin-eusage-reports.column.issn" />,
                      eissn: <FormattedMessage id="ui-plugin-eusage-reports.column.eissn" />,
                      doi: <FormattedMessage id="ui-plugin-eusage-reports.column.doi" />,
                      status: <FormattedMessage id="ui-plugin-eusage-reports.column.status" />,
                      action: <FormattedMessage id="ui-plugin-eusage-reports.column.action" />,
                    }}
                    columnWidths={{
                      id: '90px',
                      counterReportTitle: '300px',
                      kbTitleName: '300px',
                      kbTitleId: '90px',
                      isbn: '150px',
                      issn: '100px',
                      eissn: '100px',
                      doi: '100px',
                      status: '100px',
                      action: '80px',
                    }}
                    formatter={{
                      kbTitleName: r => maybeLinkTitle(r),
                      id: r => r.id.substring(0, 8),
                      kbTitleId: r => (r.kbTitleId || '').substring(0, 8),
                      isbn: r => r.ISBN,
                      issn: r => r.printISSN,
                      eissn: r => r.onlineISSN,
                      doi: r => r.DOI,
                      status: r => calculateStatus(intl, r),
                      action: r => actionMenu(intl, callout, okapiKy, r, setRecordToEdit, triggerReRender, data.reportTitles),
                    }}
                    contentData={data.reportTitles}
                    totalCount={count}
                    nonInteractiveHeaders={[]}
                    onHeaderClick={sasqParams.onSort}
                    onNeedMoreData={onNeedMoreData}
                    ignoredAdditionalPropToTriggerReRender={ignoredAdditionalPropToTriggerReRender}
                  />
                );
              }
            }
          </SearchAndSortQuery>
        </Pane>
      </Paneset>
    </HasCommand>
  );
}


MatchEditor.propTypes = {
  matchType: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.shape({
    usageDataProvider: PropTypes.shape({
      label: PropTypes.string.isRequired,
    }).isRequired,
    categories: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        count: PropTypes.number,
      }).isRequired,
    ).isRequired,
    reportTitles: PropTypes.arrayOf(
      PropTypes.shape({
        kbTitleId: PropTypes.string,
        kbManualMatch: PropTypes.bool.isRequired,
      }).isRequired,
    ).isRequired,
  }).isRequired,
  source: PropTypes.shape({
    loaded: PropTypes.func.isRequired,
    pending: PropTypes.func.isRequired,
    totalCount: PropTypes.func.isRequired,
  }),
  onNeedMoreData: PropTypes.func.isRequired,
  mutator: PropTypes.shape({
    query: PropTypes.shape({
      update: PropTypes.func.isRequired,
    }).isRequired,
  }).isRequired,
  paneTitleRef: PropTypes.object,
};


export default MatchEditor;
