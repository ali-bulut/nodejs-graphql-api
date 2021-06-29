const db = require('./db');

const Query = {
    jobs: () => db.jobs.list(),
    job: (root, args) => db.jobs.get(args.id),
    company: (root, args) => db.companies.get(args.id)
}

const Mutation = {
    // createJob: (root, {companyId, title, description}) => {
    //     const id = db.jobs.create({companyId, title, description});
    //     return db.jobs.get(id);
    // }

    // input is coming from graphQL input(CreateJobInput) that is assigned to createJob mutation as parameter.
    createJob: (root, {input}, context) => {
        if(!context.user){
            throw new Error("Unauthorized!")
        }
        const id = db.jobs.create({...input, companyId: context.user.companyId});
        return db.jobs.get(id);
    }
}

// naming is important! In schema, company is inside of the Job. So here it should be same.
const Job = {
    company: (job) => db.companies.get(job.companyId)
}

const Company = {
    jobs: (company) => db.jobs.list().filter((job) => job.companyId === company.id)
}

module.exports = { Query, Mutation, Job, Company };