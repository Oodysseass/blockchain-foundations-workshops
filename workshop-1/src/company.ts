export class Company {
    name: string
    location: string
    value?: number

    constructor(name: string, location: string, value?: number) {
        this.name = name
        this.location = location
        this.value = value
    }

    adjustValueByPercent(percent: number) {
        if (this.value !== undefined) {
            this.value *= (1 + percent / 100)
        }
    }

    description(): string {
        if (this.value !== undefined) {
            return `Company's name is ${this.name} at ${this.location}. Evaluated at ${this.value}.`
        } else {
            return `Company's name is ${this.name} at ${this.location}. Not evaluated yet.`
        }
    }

    toObjectForm(): CompanyType {
        if (this.value !== undefined) {
            return {
                name: this.name,
                location: this.location,
                value: this.value
            }
        } else {
            return {
                name: this.name,
                location: this.location,
            }
        }
    }
}

export type CompanyType = {
    name: string,
    location: string,
    value?: number
}
