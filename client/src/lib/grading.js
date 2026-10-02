// Pure grading rules — shared by the UI and whichever data source is active.

export const GRADES = ['A', 'B', 'C', 'D', 'E', 'F']
const GRADE_POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 }

export function gradeFor(score) {
    if (score == null) return '—'
    if (score >= 70) return 'A'
    if (score >= 60) return 'B'
    if (score >= 50) return 'C'
    if (score >= 45) return 'D'
    if (score >= 40) return 'E'
    return 'F'
}

// 5-point CGPA, weighted by course units. rows: [{ score, units }]
export function computeGPA(rows) {
    let points = 0
    let units = 0
    for (const { score, units: u } of rows) {
        if (score == null) continue
        points += GRADE_POINTS[gradeFor(score)] * u
        units += u
    }
    return units ? (points / units).toFixed(2) : '—'
}

// Share of records that are Present or Late, as a whole percentage.
export function attendanceRate(rows) {
    if (!rows.length) return 0
    return Math.round((rows.filter((r) => r.status !== 'Absent').length / rows.length) * 100)
}
