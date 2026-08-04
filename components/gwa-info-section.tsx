import { InfoAccordion, type AccordionItem } from '@/components/info-accordion'

function InfoTable({ headers, rows }: { headers: [string, string]; rows: [string, string][] }) {
  return (
    <table className="mt-2 w-full border-collapse overflow-hidden rounded-lg border border-border text-left text-sm">
      <thead>
        <tr className="bg-secondary">
          <th className="px-3 py-2 font-medium text-foreground">{headers[0]}</th>
          <th className="px-3 py-2 font-medium text-foreground">{headers[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([a, b]) => (
          <tr key={a} className="border-t border-border">
            <td className="px-3 py-2">{a}</td>
            <td className="px-3 py-2">{b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const ITEMS: AccordionItem[] = [
  {
    id: 'gwa',
    title: 'General Weighted Average (GWA)',
    content: (
      <p>
        The General Weighted Average (GWA) measures a student&rsquo;s semestral or overall
        performance across all academic coursework. It includes every academic subject taken,
        including those from prior programs and non-curriculum enrichment courses, but excludes
        non-academic subjects (e.g., PE, NSTP), dropped courses, and grades marked as INC.
      </p>
    ),
  },
  {
    id: 'cwag',
    title: 'Cumulative Weighted Average Grade (CWAG)',
    content: (
      <>
        <p>
          The Cumulative Weighted Average Grade (CWAG) measures graduating honor eligibility
          across a student&rsquo;s entire degree program up to graduation. It follows the same
          formula as the General Weighted Average (GWA), but applies exclusively to courses
          within the approved Program of Study (plus any required Residence Rules courses),
          excluding extra academic courses outside the official curriculum.
        </p>
        <p className="mt-3">
          Note: If computing your CWAG, please exclude any courses outside your official Program
          of Study before calculating your grade on this site.
        </p>
      </>
    ),
  },
  {
    id: 'grading-system',
    title: 'Grading System',
    content: (
      <>
        <p>Student performance is evaluated at the end of each term using the following scale:</p>
        <InfoTable
          headers={['Grade', 'Description']}
          rows={[
            ['1.00, 1.25', 'Excellent'],
            ['1.50, 1.75', 'Very Good'],
            ['2.00, 2.25', 'Good'],
            ['2.50, 2.75', 'Satisfactory'],
            ['3.00', 'Passed'],
            ['4.00', 'Conditional Failure *'],
            ['5.00', 'Failed'],
            ['INC', 'Incomplete **'],
          ]}
        />
        <p className="mt-3 text-xs">
          * Requires retaking the course or passing a re-examination. Passing the re-exam
          resolves the mark to a 3.00; failing results in a 5.00.
        </p>
        <p className="mt-1 text-xs">
          ** Issued when a student with a passing grade misses the final exam or course
          requirements due to a valid reason (e.g., illness). If the student&rsquo;s standing is
          already failing, missing the final exam automatically results in a 5.00.
        </p>
      </>
    ),
  },
  {
    id: 'honorific-scholarships',
    title: 'Honorific Scholarships',
    content: (
      <>
        <p>
          Honorific scholarships are awarded each semester to students who carry a full academic
          load, complete all non-academic requirements (e.g., PE and NSTP), earn a grade of 3.00
          or better in all courses, and meet the following semestral General Weighted Average
          (GWA) cutoffs:
        </p>
        <InfoTable
          headers={['Honorific Scholarship', 'GWA Cutoff']}
          rows={[
            ['University Scholar', '1.45'],
            ['College Scholar', '1.75'],
          ]}
        />
        <p className="mt-3">
          Note: Honorific scholarships are academic distinctions only and do not provide full or
          partial tuition fee discounts.
        </p>
      </>
    ),
  },
  {
    id: 'latin-honors',
    title: 'Latin Honors',
    content: (
      <>
        <p>
          Latin honors shall be awarded to graduating students who complete their degree programs
          with a final Cumulative Weighted Average Grade (CWAG) meeting the following cutoffs:
        </p>
        <InfoTable
          headers={['Honorific Scholarship', 'CWAG Cutoff']}
          rows={[
            ['Summa Cum Laude', '1.20'],
            ['Magna Cum Laude', '1.45'],
            ['Cum Laude', '1.75'],
          ]}
        />
      </>
    ),
  },
]

export function GwaInfoSection() {
  return <InfoAccordion items={ITEMS} />
}
