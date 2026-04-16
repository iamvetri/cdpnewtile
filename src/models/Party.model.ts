export interface IParty {
    id: string;
    type?: string;
    name?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    nickname?: string;
    birthdate?: string;
    irs?: string;
    employment?: any[];
    identificationDocuments?: any[];
    contacts?: any[];
    customData?: any;
}
