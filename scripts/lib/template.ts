export function checkErrors(template: string, variables: Readonly<Record<string, string>>) {
  const providedNames = Object.keys(variables)
  const requiredNames = Array
    .from(template.matchAll(/{(?<name>[A-Z0-9_]+)}/g))
    .map(match => match.groups!.name)
  const redundantNames = providedNames.filter(name => !requiredNames.includes(name))
  if (redundantNames.length) {
    throw new Error('Redundant variables: ' + redundantNames.join(', '))
  }
  const missingNames = requiredNames.filter(
    (name, index) => requiredNames.indexOf(name) === index && !providedNames.includes(name),
  )
  if (missingNames.length) {
    throw new Error('Missing variables: ' + missingNames.join(', '))
  }
}

export function applyTemplate(template: string, variables: Readonly<Record<string, string>>): string {
  checkErrors(template, variables)
  return Object.entries(variables).reduce(
    (template, [key, value]) => template.replaceAll('{' + key + '}', value),
    template,
  )
}

export default applyTemplate
