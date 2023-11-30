export const numberEnumToArray = (enumObject: Record<string, string | number>) => {
  return Object.values(enumObject).filter((val) => typeof val === 'number') as number[]
}
