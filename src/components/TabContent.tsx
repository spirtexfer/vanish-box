import { Tab } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'
import { FilesSection } from './FilesSection'
import { NotesSection } from './NotesSection'
import { SketchesSection } from './SketchesSection'
import { LinksSection } from './LinksSection'

interface TabContentProps {
  tab: Tab
  colors: ColorTokens
}

export function TabContent({ tab, colors }: TabContentProps) {
  const sectionLabel: Record<string, string> = {
    files: 'Files',
    notes: 'Notes',
    sketches: 'Sketches',
    links: 'Links',
  }

  return (
    <div
      key={tab.id}
      className="vb-tab-content"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {tab.sections.map((section) => (
        <section key={section.type}>
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: colors.textMuted,
            }}
          >
            {sectionLabel[section.type]}
          </h3>
          {section.type === 'files' ? (
            <FilesSection tabId={tab.id} colors={colors} />
          ) : section.type === 'notes' ? (
            <NotesSection tabId={tab.id} colors={colors} />
          ) : section.type === 'links' ? (
            <LinksSection tabId={tab.id} colors={colors} />
          ) : (
            <SketchesSection tabId={tab.id} colors={colors} />
          )}
        </section>
      ))}
    </div>
  )
}
