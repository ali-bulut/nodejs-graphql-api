const db = require('./db');

const Query = {
    jobs: () => db.jobs.list(),
    job: (root, args) => db.jobs.get(args.id),
    company: (root, args) => db.companies.get(args.id)
}

// naming is important! In schema, company is inside of the Job. So here it should be same.
const Job = {
    company: (job) => db.companies.get(job.companyId)
}

module.exports = { Query, Job };