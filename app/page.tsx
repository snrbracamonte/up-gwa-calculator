import { GwaCalculator } from '@/components/gwa-calculator'

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-[100rem] items-center gap-3 px-4 py-4 sm:px-8">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-primary-foreground/70 font-serif text-lg font-bold tracking-tight"
            aria-hidden="true"
          >
            UP
          </span>
          <div>
            <p className="font-serif text-base font-semibold leading-tight sm:text-lg">
              University of the Philippines
            </p>
            <p className="text-xs text-primary-foreground/80">GWA Calculator</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[100rem] px-4 py-8 sm:px-8 sm:py-12">
        <section className="mb-8 max-w-2xl">
          <h1 className="text-balance font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Compute your General Weighted Average
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            Add your courses, enter the units and your final grade on the official UP scale, and
            instantly see your GWA along with your Latin honors standing. Everything is calculated
            right in your browser.
          </p>
        </section>

        <GwaCalculator />

        <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          <p className="text-pretty">
            This is an unofficial tool for estimating your GWA. Always confirm your official records
            and honors eligibility with your college or the Office of the University Registrar.
          </p>
        </footer>
      </main>
    </div>
  )
}
