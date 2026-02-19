import canonicalize from 'canonicalize'
import { Company, type CompanyType } from './company'

const acme = new Company("ACME", "Road Runner's Valley", 1000)

console.log(acme.description())

acme.adjustValueByPercent(10)

console.log(acme.value)

console.log(acme.toObjectForm())

const valueDoubler = (company: CompanyType): CompanyType => {
    if (company.value !== undefined) {
        return {
            name: company.name,
            location: company.location,
            value: company.value * 2
        }
    }
    return {
        name: company.name,
        location: company.location,
    }
}

function valueHalver({ name, location, value }: { name: string, location: string, value?: number }) {
    if (value !== undefined) {
        return {
            name,
            location,
            value: value / 2
        }
    }
    return {
        name,
        location
    }
}

const acmeObject = acme.toObjectForm()

console.log(valueDoubler(acmeObject))
console.log(valueHalver(acmeObject))

console.log(JSON.stringify(acmeObject))
console.log(canonicalize(acmeObject))
