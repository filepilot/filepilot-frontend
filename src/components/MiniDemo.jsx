import { useState } from 'react';
import './MiniDemo.css';

const DOC_TITLE  = 'Q2 Marketing Plan';
const DOC_AUTHOR = 'Sarah Chen';

/*
  diffs   — keyed by base version label (e.g. 'v1', 'v2')
            always compares against the last APPROVED version, not just prev
  segments — same keying, for inline highlights in full text
  canReject: false on v1 — base version has nothing to fall back to
*/
const VERSIONS = [
  {
    id: 1, label: 'v1', date: 'Mar 10', summary: 'Initial draft',
    canReject: false,
    diffs: {},
    segments: {
      base: [
        { t: 'n', s: 'Increase brand reach by 40% across social channels. Focus areas: Instagram reels, LinkedIn thought leadership, email nurture sequences. Total budget: $12,000. Timeline: April – June 2026.' },
      ],
    },
  },
  {
    id: 2, label: 'v2', date: 'Mar 14', summary: 'Budget revision',
    canReject: true,
    diffs: {
      v1: [
        { t: 'd', s: 'Budget: $12,000' },
        { t: 'a', s: 'Budget: $18,500' },
        { t: 'a', s: 'New channel: podcast sponsorships' },
      ],
    },
    segments: {
      v1: [
        { t: 'n', s: 'Increase brand reach by 40% across social channels. Focus areas: Instagram reels, LinkedIn thought leadership, email nurture sequences' },
        { t: 'a', s: ', podcast sponsorships' },
        { t: 'n', s: '. Total budget: ' },
        { t: 'd', s: '$12,000' },
        { t: 'a', s: '$18,500' },
        { t: 'n', s: '. Timeline: April – June 2026.' },
      ],
    },
  },
  {
    id: 3, label: 'v3', date: 'Mar 18', summary: 'Scope extended',
    canReject: true,
    diffs: {
      // v2 approved → compare v3 to v2
      v2: [
        { t: 'd', s: 'Timeline: April – June 2026' },
        { t: 'a', s: 'Timeline: April – September 2026' },
        { t: 'a', s: 'KPI added: 2M impressions by end of Q3' },
      ],
      // v2 rejected → compare v3 to v1 (cumulative)
      v1: [
        { t: 'd', s: 'Budget: $12,000' },
        { t: 'a', s: 'Budget: $18,500' },
        { t: 'a', s: 'New channel: podcast sponsorships' },
        { t: 'd', s: 'Timeline: April – June 2026' },
        { t: 'a', s: 'Timeline: April – September 2026' },
        { t: 'a', s: 'KPI added: 2M impressions by end of Q3' },
      ],
    },
    segments: {
      v2: [
        { t: 'n', s: 'Increase brand reach by 40% across social channels. Focus areas: Instagram reels, LinkedIn thought leadership, email nurture sequences, podcast sponsorships. Total budget: $18,500. Timeline: April – ' },
        { t: 'd', s: 'June' },
        { t: 'a', s: 'September' },
        { t: 'n', s: ' 2026. ' },
        { t: 'a', s: 'KPI: 2M impressions by end of Q3.' },
      ],
      v1: [
        { t: 'n', s: 'Increase brand reach by 40% across social channels. Focus areas: Instagram reels, LinkedIn thought leadership, email nurture sequences' },
        { t: 'a', s: ', podcast sponsorships' },
        { t: 'n', s: '. Total budget: ' },
        { t: 'd', s: '$12,000' },
        { t: 'a', s: '$18,500' },
        { t: 'n', s: '. Timeline: April – ' },
        { t: 'd', s: 'June' },
        { t: 'a', s: 'September' },
        { t: 'n', s: ' 2026. ' },
        { t: 'a', s: 'KPI: 2M impressions by end of Q3.' },
      ],
    },
  },
  {
    id: 4, label: 'v4', date: 'Mar 22', summary: 'Final draft',
    canReject: true,
    diffs: {
      // v3 approved → compare v4 to v3
      v3: [
        { t: 'd', s: 'Reach target: 40%' },
        { t: 'a', s: 'Reach target: 45%' },
        { t: 'a', s: 'Legal sign-off required for all channels' },
      ],
      // v3 rejected, v2 approved → compare v4 to v2
      v2: [
        { t: 'd', s: 'Timeline: April – June 2026' },
        { t: 'a', s: 'Timeline: April – September 2026' },
        { t: 'a', s: 'KPI added: 2M impressions by end of Q3' },
        { t: 'd', s: 'Reach target: 40%' },
        { t: 'a', s: 'Reach target: 45%' },
        { t: 'a', s: 'Legal sign-off required for all channels' },
      ],
      // v2 + v3 both rejected → compare v4 to v1 (all cumulative)
      v1: [
        { t: 'd', s: 'Budget: $12,000' },
        { t: 'a', s: 'Budget: $18,500' },
        { t: 'a', s: 'New channel: podcast sponsorships' },
        { t: 'd', s: 'Timeline: April – June 2026' },
        { t: 'a', s: 'Timeline: April – September 2026' },
        { t: 'a', s: 'KPI added: 2M impressions by end of Q3' },
        { t: 'd', s: 'Reach target: 40%' },
        { t: 'a', s: 'Reach target: 45%' },
        { t: 'a', s: 'Legal sign-off required for all channels' },
      ],
    },
    segments: {
      v3: [
        { t: 'n', s: 'Increase brand reach by ' },
        { t: 'd', s: '40%' },
        { t: 'a', s: '45%' },
        { t: 'n', s: ' across social channels. Focus areas: Instagram reels, LinkedIn thought leadership, email nurture sequences, podcast sponsorships. Total budget: $18,500. Timeline: April – September 2026. KPI: 2M impressions by end of Q3. ' },
        { t: 'a', s: 'All channels require legal sign-off before launch.' },
      ],
      v2: [
        { t: 'n', s: 'Increase brand reach by ' },
        { t: 'd', s: '40%' },
        { t: 'a', s: '45%' },
        { t: 'n', s: ' across social channels. Focus areas: Instagram reels, LinkedIn thought leadership, email nurture sequences, podcast sponsorships. Total budget: $18,500. Timeline: April – ' },
        { t: 'd', s: 'June' },
        { t: 'a', s: 'September' },
        { t: 'n', s: ' 2026. KPI: 2M impressions by end of Q3. ' },
        { t: 'a', s: 'All channels require legal sign-off before launch.' },
      ],
      v1: [
        { t: 'n', s: 'Increase brand reach by ' },
        { t: 'd', s: '40%' },
        { t: 'a', s: '45%' },
        { t: 'n', s: ' across social channels. Focus areas: Instagram reels, LinkedIn thought leadership, email nurture sequences' },
        { t: 'a', s: ', podcast sponsorships' },
        { t: 'n', s: '. Total budget: ' },
        { t: 'd', s: '$12,000' },
        { t: 'a', s: '$18,500' },
        { t: 'n', s: '. Timeline: April – ' },
        { t: 'd', s: 'June' },
        { t: 'a', s: 'September' },
        { t: 'n', s: ' 2026. KPI: 2M impressions by end of Q3. ' },
        { t: 'a', s: 'All channels require legal sign-off before launch.' },
      ],
    },
  },
];

const STATUS_PENDING  = 'pending';
const STATUS_APPROVED = 'approved';
const STATUS_REJECTED = 'rejected';

function DiffLine({ t, s }) {
  if (t === 'a') return <div className="dm-diff__line dm-diff__line--add"><span className="dm-diff__sign">+</span>{s}</div>;
  if (t === 'd') return <div className="dm-diff__line dm-diff__line--del"><span className="dm-diff__sign">–</span>{s}</div>;
  return null;
}

export default function MiniDemo() {
  const initStatuses = () => Object.fromEntries(VERSIONS.map(v => [v.id, STATUS_PENDING]));
  const [statuses, setStatuses] = useState(initStatuses);
  const [activeId, setActiveId] = useState(1);
  const [leaving, setLeaving]   = useState(false);
  const [comparing, setComparing] = useState(false);

  const pendingVersions  = VERSIONS.filter(v => statuses[v.id] === STATUS_PENDING);
  const approvedVersions = VERSIONS.filter(v => statuses[v.id] === STATUS_APPROVED);
  const rejectedVersions = VERSIONS.filter(v => statuses[v.id] === STATUS_REJECTED);
  const allDone   = pendingVersions.length === 0;
  const activeVer = VERSIONS.find(v => v.id === activeId);

  const activeIdx     = activeVer ? VERSIONS.findIndex(v => v.id === activeVer.id) + 1 : null;
  const isLastPending = activeVer && pendingVersions.length === 1;

  const lastApprovedVer = approvedVersions.length > 0
    ? approvedVersions[approvedVersions.length - 1]
    : null;

  // Last approved version with id < given id (used during review)
  const getLastApprovedBefore = (verId) =>
    [...approvedVersions].reverse().find(v => v.id < verId) ?? null;

  // Current base for the version being reviewed
  const activeBase = activeVer && activeVer.id > 1
    ? getLastApprovedBefore(activeVer.id)
    : null;

  // Total net additions across the approved chain
  const totalChanges = approvedVersions.reduce((acc, ver, idx) => {
    if (idx === 0) return acc;
    const prev = approvedVersions[idx - 1];
    const diff = ver.diffs[prev.label];
    return acc + (diff?.filter(l => l.t === 'a').length ?? 0);
  }, 0);

  const activeDiff     = activeBase ? activeVer.diffs[activeBase.label]     : null;
  const activeSegments = activeBase
    ? (activeVer.segments[activeBase.label] || activeVer.segments.base)
    : (activeVer?.segments.base ?? []);

  const decide = (id, decision) => {
    setLeaving(true);
    setTimeout(() => {
      const next = { ...statuses, [id]: decision };
      setStatuses(next);
      const nextPending = VERSIONS.find(v => v.id > id && next[v.id] === STATUS_PENDING)
                       || VERSIONS.find(v => next[v.id] === STATUS_PENDING);
      setActiveId(nextPending ? nextPending.id : null);
      setLeaving(false);
    }, 190);
  };

  const reset = () => {
    setStatuses(initStatuses());
    setActiveId(1);
    setLeaving(false);
    setComparing(false);
  };

  const selectVer = (id) => {
    if (statuses[id] === STATUS_PENDING && !allDone) {
      setLeaving(true);
      setTimeout(() => { setActiveId(id); setLeaving(false); }, 130);
    }
  };

  return (
    <div className="dm">

      {/* ── macOS title bar ── */}
      <div className="dm-titlebar">
        <span className="dm-titlebar__dots">
          <span className="dm-dot dm-dot--r" />
          <span className="dm-dot dm-dot--y" />
          <span className="dm-dot dm-dot--g" />
        </span>
        <span className="dm-titlebar__name">
          {allDone ? 'filepilot — version history' : 'filepilot — version review'}
        </span>
        <button className="dm-titlebar__restart" onClick={reset}>restart</button>
      </div>

      {/* ── App nav bar ── */}
      <div className="dm-nav">
        <div className="dm-nav__bc">
          <span className="dm-nav__bc-parent">Documents</span>
          <span className="dm-nav__bc-sep">/</span>
          <span className="dm-nav__bc-cur">{DOC_TITLE}</span>
        </div>
        <span className="dm-nav__role">{allDone ? 'Audit trail' : 'Reviewer'}</span>
      </div>

      {/* ── Main layout ── */}
      <div className="dm-layout">

        {/* Sidebar */}
        <div className="dm-sidebar">
          <div className="dm-sidebar__hd">
            <span className="dm-sidebar__label">Versions</span>
            {!allDone
              ? <span className="dm-sidebar__pending">{pendingVersions.length} left</span>
              : <span className="dm-sidebar__pending dm-sidebar__pending--done">{VERSIONS.length} total</span>
            }
          </div>

          <div className="dm-vchain">
            {VERSIONS.map((ver, idx) => {
              const st       = statuses[ver.id];
              const isActive = ver.id === activeId && !allDone;
              const isDone   = st !== STATUS_PENDING;
              const prevApproved = idx > 0 && statuses[VERSIONS[idx - 1].id] === STATUS_APPROVED;

              return (
                <div key={ver.id} className="dm-vwrap">
                  {idx > 0 && (
                    <div className={`dm-vstem ${prevApproved ? 'dm-vstem--green' : ''}`} />
                  )}
                  <div
                    className={[
                      'dm-vitem',
                      isActive ? 'dm-vitem--active' : '',
                      isDone   ? 'dm-vitem--done'   : '',
                      allDone && st === STATUS_APPROVED ? 'dm-vitem--history' : '',
                    ].join(' ')}
                    onClick={() => selectVer(ver.id)}
                  >
                    <div className={`dm-vnode dm-vnode--${st}`}>
                      {st === STATUS_APPROVED && '✓'}
                      {st === STATUS_REJECTED && '✕'}
                    </div>
                    <div className="dm-vinfo">
                      <div className="dm-vinfo__top">
                        <span className="dm-vinfo__label">{ver.label}</span>
                        {lastApprovedVer?.id === ver.id && (
                          <span className="dm-vinfo__final">final</span>
                        )}
                      </div>
                      <span className="dm-vinfo__summary">{ver.summary}</span>
                      {!isDone && <span className="dm-vinfo__date">{ver.date}</span>}
                    </div>
                    {isDone && (
                      <span className={`dm-vmark dm-vmark--${st}`}>
                        {st === STATUS_APPROVED ? '✓' : '✕'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {(approvedVersions.length > 0 || rejectedVersions.length > 0) && (
            <div className="dm-sidebar__stats">
              {approvedVersions.length > 0 && (
                <span className="dm-stat dm-stat--approved">{approvedVersions.length} approved</span>
              )}
              {rejectedVersions.length > 0 && (
                <span className="dm-stat dm-stat--rejected">{rejectedVersions.length} rejected</span>
              )}
            </div>
          )}
        </div>

        {/* Detail pane */}
        <div className="dm-detail">

          {/* ── REVIEW MODE ── */}
          {!allDone && activeVer ? (
            <div className={`dm-detail__inner ${leaving ? 'dm-detail--out' : 'dm-detail--in'}`}>

              <div className="dm-dh">
                <div className="dm-dh__left">
                  <h2 className="dm-dh__title">{DOC_TITLE}</h2>
                  <p className="dm-dh__meta">{DOC_AUTHOR} · {activeVer.date}</p>
                </div>
                <div className="dm-dh__badges">
                  {isLastPending && (
                    <span className="dm-badge dm-badge--final">Final</span>
                  )}
                  <span className="dm-badge dm-badge--review">
                    {activeVer.label}<span className="dm-badge__counter"> · {activeIdx} of {VERSIONS.length}</span>
                  </span>
                </div>
              </div>

              {/* Diff block */}
              {activeDiff ? (
                <div className="dm-diff">
                  <div className="dm-diff__hd">
                    <span className="dm-diff__title">
                      Changes from {activeBase.label}
                      {(() => {
                        const baseIdx = VERSIONS.findIndex(v => v.id === activeBase.id);
                        const skipped = VERSIONS
                          .slice(baseIdx + 1, activeIdx - 1)
                          .filter(v => statuses[v.id] === STATUS_REJECTED);
                        if (!skipped.length) return null;
                        return (
                          <span className="dm-diff__skip">
                            {' '}({skipped.map(v => v.label).join(', ')} {skipped.length === 1 ? 'was' : 'were'} rejected)
                          </span>
                        );
                      })()}
                    </span>
                    <span className="dm-diff__legend">
                      <span className="dm-diff__legend-add">+ added</span>
                      <span className="dm-diff__legend-del">– removed</span>
                    </span>
                  </div>
                  <div className="dm-diff__body">
                    {activeDiff.map((line, i) => <DiffLine key={i} {...line} />)}
                  </div>
                </div>
              ) : (
                <div className="dm-diff dm-diff--base">
                  <span className="dm-diff__base-note">Base version — no prior version to compare</span>
                </div>
              )}

              {/* Full content with inline diff */}
              <div className="dm-body">
                <span className="dm-body__label">Full content</span>
                <p className="dm-body__text">
                  {activeSegments.map((seg, i) => {
                    if (seg.t === 'a') return <span key={i} className="dm-seg-add">{seg.s}</span>;
                    if (seg.t === 'd') return <span key={i} className="dm-seg-del">{seg.s}</span>;
                    return <span key={i}>{seg.s}</span>;
                  })}
                </p>
              </div>

              {/* Action bar */}
              <div className="dm-actionbar">
                <p className="dm-actionbar__hint">
                  {!activeVer.canReject
                    ? 'Base version — approve to start the review chain.'
                    : isLastPending
                      ? 'This is the final version — approve to publish the chain.'
                      : `Reviewing ${activeVer.label} of ${DOC_TITLE}.`}
                </p>
                <div className="dm-actionbar__row">
                  <button className="dm-btn dm-btn--approve" onClick={() => decide(activeVer.id, STATUS_APPROVED)}>
                    Approve
                  </button>
                  {activeVer.canReject && (
                    <button className="dm-btn dm-btn--reject" onClick={() => decide(activeVer.id, STATUS_REJECTED)}>
                      Reject
                    </button>
                  )}
                </div>
              </div>

            </div>

          ) : (

            /* ── HISTORY / AUDIT TRAIL MODE ── */
            <div className="dm-history dm-detail--in">

              <div className="dm-history__hd">
                <span className="dm-history__eyebrow">Audit trail</span>
                <span className="dm-history__title">{DOC_TITLE}</span>
              </div>

              {lastApprovedVer && (
                <div className="dm-evolution">
                  <div className="dm-evolution__path">
                    <span className="dm-evolution__node dm-evolution__node--base">
                      {VERSIONS[0].label}
                      <span className="dm-evolution__sub">base</span>
                    </span>
                    <span className="dm-evolution__arrow">→</span>
                    <span className="dm-evolution__node dm-evolution__node--final">
                      {lastApprovedVer.label}
                      <span className="dm-evolution__sub">final</span>
                    </span>
                  </div>
                  <div className="dm-evolution__right">
                    <span className="dm-evolution__meta">
                      {totalChanges} change{totalChanges !== 1 ? 's' : ''} · {approvedVersions.length} version{approvedVersions.length !== 1 ? 's' : ''} approved
                    </span>
                    {lastApprovedVer.id > VERSIONS[0].id && (
                      <button
                        className={`dm-btn dm-btn--compare ${comparing ? 'dm-btn--compare-active' : ''}`}
                        onClick={() => setComparing(c => !c)}
                      >
                        {comparing ? 'Hide compare' : `Compare ${VERSIONS[0].label} → ${lastApprovedVer.label}`}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="dm-history__scroll">

                {comparing && lastApprovedVer && lastApprovedVer.diffs['v1'] ? (

                  /* ── Compare view ── */
                  <div className="dm-compare dm-detail--in">
                    <div className="dm-diff">
                      <div className="dm-diff__hd">
                        <span className="dm-diff__title">All changes: {VERSIONS[0].label} → {lastApprovedVer.label}</span>
                        <span className="dm-diff__legend">
                          <span className="dm-diff__legend-add">+ added</span>
                          <span className="dm-diff__legend-del">– removed</span>
                        </span>
                      </div>
                      <div className="dm-diff__body">
                        {lastApprovedVer.diffs['v1'].map((line, i) => <DiffLine key={i} {...line} />)}
                      </div>
                    </div>
                    <div className="dm-body">
                      <span className="dm-body__label">Final content (highlighted vs {VERSIONS[0].label})</span>
                      <p className="dm-body__text">
                        {(lastApprovedVer.segments['v1'] || lastApprovedVer.segments.base).map((seg, i) => {
                          if (seg.t === 'a') return <span key={i} className="dm-seg-add">{seg.s}</span>;
                          if (seg.t === 'd') return <span key={i} className="dm-seg-del">{seg.s}</span>;
                          return <span key={i}>{seg.s}</span>;
                        })}
                      </p>
                    </div>
                  </div>

                ) : (
                  <>
                    {/* ── Approved chain only ── */}
                    <div className="dm-chain">
                      {approvedVersions.map((ver, idx) => {
                        const isFinal  = lastApprovedVer?.id === ver.id;
                        const prevAppr = idx > 0 ? approvedVersions[idx - 1] : null;
                        const chainDiff = prevAppr ? ver.diffs[prevAppr.label] : null;

                        return (
                          <div key={ver.id} className="dm-chain__item">
                            {idx > 0 && <div className="dm-chain__conn" />}

                            <div className={`dm-hver dm-hver--approved ${isFinal ? 'dm-hver--final' : ''}`}>
                              <div className="dm-hver__row">
                                <span className="dm-hver__badge dm-hver__badge--approved">{ver.label}</span>
                                {isFinal && <span className="dm-hver__final-tag">Final</span>}
                                <span className="dm-hver__summary">{ver.summary}</span>
                                <span className="dm-hver__date">{ver.date}</span>
                                <span className="dm-hver__verdict dm-hver__verdict--approved">✓ Approved</span>
                              </div>

                              {chainDiff ? (
                                <div className="dm-hver__diff">
                                  {chainDiff.map((line, i) => <DiffLine key={i} {...line} />)}
                                </div>
                              ) : (
                                <div className="dm-hver__base-note">Base version — starting point of the chain</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ── Rejected versions — compact footnote ── */}
                    {rejectedVersions.length > 0 && (
                      <div className="dm-rejected-pile">
                        <span className="dm-rejected-pile__label">Not applied</span>
                        {rejectedVersions.map(ver => (
                          <div key={ver.id} className="dm-rejected-item">
                            <span className="dm-rejected-item__badge">{ver.label}</span>
                            <span className="dm-rejected-item__summary">{ver.summary}</span>
                            <span className="dm-rejected-item__date">{ver.date}</span>
                            <span className="dm-rejected-item__verdict">✕</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

              </div>

              <div className="dm-history__footer">
                <span className="dm-history__audit-note">
                  Full audit trail saved · {approvedVersions.length} approved · {rejectedVersions.length} rejected
                </span>
                <button className="dm-btn dm-btn--outline" onClick={reset}>Review again</button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
