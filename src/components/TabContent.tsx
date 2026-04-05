import { Tab } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'
import { FilesSection } from './FilesSection'

interface TabContentProps {
  tab: Tab
  colors: ColorTokens
}

export function TabContent({ tab, colors }: TabContentProps) {
  const sectionLabel: Record<string, string> = {
    files: 'Files',
    notes: 'Notes',
    sketches: 'Sketches',
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {tab.sections.map((section) => (
        <section key={section.type}>
          <h3
            style={{
              margin: '0 0 6px 0',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: colors.textMuted,
            }}
          >
            {sectionLabel[section.type]}
          </h3>
          {section.type === 'files' ? (
            <FilesSection tabId={tab.id} colors={colors} />
          ) : (
            <div
              style={{
                background: colors.bgSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                color: colors.textMuted,
                textAlign: 'center',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {section.type === 'notes' && 'No notes yet'}
              {section.type === 'sketches' && 'No sketches yet'}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
