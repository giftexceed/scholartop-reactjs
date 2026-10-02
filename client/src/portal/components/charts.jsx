import { useState } from 'react'

// Single-series charts: the card title names the series, so no legend box.
// Values live in the tooltip (hover/focus), the axis ticks, and — for short
// series — a label on the column cap.

function niceMax(v) {
    if (v <= 0) return 1
    const mag = 10 ** Math.floor(Math.log10(v))
    const step = [1, 2, 2.5, 5, 10].find((s) => s * mag >= v / 4) * mag
    return Math.ceil(v / step) * step
}

export function ColumnChart({ data, format = (v) => v, max, height = 200, showValues = false, label }) {
    const [active, setActive] = useState(null)
    const top = max ?? niceMax(Math.max(...data.map((d) => d.value), 0))
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * top)

    return (
        <figure className='chart' aria-label={label}>
            <div className='col-chart' style={{ height }}>
                <div className='col-axis' aria-hidden='true'>
                    {ticks.slice().reverse().map((t) => <span key={t}>{format(Math.round(t))}</span>)}
                </div>
                <div className='col-plot'>
                    {ticks.map((t) => (
                        <div key={t} className={`gridline ${t === 0 ? 'baseline' : ''}`} style={{ bottom: `${(t / top) * 100}%` }} />
                    ))}
                    <div className='col-bars'>
                        {data.map((d, i) => (
                            <div
                                key={d.label}
                                className='col-slot'
                                tabIndex={0}
                                onMouseEnter={() => setActive(i)}
                                onMouseLeave={() => setActive(null)}
                                onFocus={() => setActive(i)}
                                onBlur={() => setActive(null)}
                                aria-label={`${d.label}: ${format(d.value)}`}
                            >
                                <div className={`col-bar ${active === i ? 'is-active' : ''}`} style={{ height: `${(d.value / top) * 100}%` }}>
                                    {showValues && <span className='col-value'>{format(d.value)}</span>}
                                </div>
                                {active === i && (
                                    <div className='chart-tip' role='tooltip'>
                                        <strong>{format(d.value)}</strong>
                                        <span>{d.tip ?? d.label}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className='col-labels' aria-hidden='true'>
                {data.map((d) => <span key={d.label}>{d.short ?? d.label}</span>)}
            </div>
        </figure>
    )
}

export function BarList({ data, format = (v) => v, max }) {
    const [active, setActive] = useState(null)
    const top = max ?? Math.max(...data.map((d) => d.value), 1)
    return (
        <ul className='bar-list'>
            {data.map((d, i) => (
                <li
                    key={d.label}
                    tabIndex={0}
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                >
                    <span className='bar-label'>{d.label}</span>
                    <span className='bar-track'>
                        <span className={`bar-fill ${active === i ? 'is-active' : ''}`} style={{ width: `${(d.value / top) * 100}%` }} />
                    </span>
                    <span className='bar-value'>{format(d.value)}</span>
                    {active === i && d.tip && <span className='chart-tip bar-tip' role='tooltip'>{d.tip}</span>}
                </li>
            ))}
        </ul>
    )
}
