// Directory of servicing associates. Used for the signed-in user, "last
// updated by" attribution, and validating transfer targets by associate ID.

export interface Associate {
  id: string
  name: string
  role: string
}

export const ASSOCIATES: Associate[] = [
  { id: 'AS-1001', name: 'Masato Otsu', role: 'Retirement Servicing Associate' },
  { id: 'AS-1002', name: 'Dana Rivera', role: 'Senior Associate' },
  { id: 'AS-1003', name: 'Marcus Lee', role: 'Rollover Specialist' },
  { id: 'AS-1004', name: 'Priya Nair', role: 'Servicing Associate' },
]

/** The signed-in associate. */
export const CURRENT_ASSOCIATE_ID = 'AS-1001'
export const CURRENT_ASSOCIATE = 'Masato Otsu'

export function associateById(id: string): Associate | undefined {
  return ASSOCIATES.find((a) => a.id.toUpperCase() === id.trim().toUpperCase())
}

export function associateByName(name: string): Associate | undefined {
  return ASSOCIATES.find((a) => a.name === name)
}
