import { ApolloClient, HttpLink, InMemoryCache } from 'apollo-boost';
import { getAccessToken, isLoggedIn } from "./auth";

const endpointUrl = "http://localhost:9000/graphql";

const client = new ApolloClient({
    link: new HttpLink({uri: endpointUrl}),
    cache: new InMemoryCache()
})

const graphqlRequest = async (query, variables={}) => {
    const headers = {
        "content-type": "application/json",
    };
    if(isLoggedIn())
    {
        headers["authorization"] = `Bearer ${getAccessToken()}`;
    }
    const response = await fetch(endpointUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
            query,
            variables
        })
    })

    const responseBody = await response.json();
    if(responseBody.errors){
        const message = responseBody.errors.map(error => error.message).join('\n');
        throw new Error(message);
    }
    return responseBody.data;
}

export const loadJobs = async () => {
    const query = `{
        jobs{
            id
            title
            company{
                id
                name
            }
        }
    }`
    const data = await graphqlRequest(query);
    return data.jobs;
}

export const loadJob = async (id) => {
    const query = `query JobQuery($id: ID!) {
        job(id: $id) {
            id
            title
            company {
                id
                name
            }
            description
        }
    }`
    const data = await graphqlRequest(query, {id});
    return data.job;
}

export const loadCompany = async (id) => {
    const query = `query CompanyQuery($id: ID!) {
        company(id: $id) {
            id
            name
            description
            jobs {
                id
                title
            }
        }
    }`
    const data = await graphqlRequest(query, {id});
    return data.company;
}

export const createJob = async (input) => {
    /* job: createJob(input: $input) => we don't need to use `job:` unless we want to get the result as job object. Only difference is seen in the following;
    {
        data: {
            job: {
                id: "134324",
                title: "sdgsgd"
            }
        }
    }

    {
        data: {
            createJob: {
                id: "1241341",
                title: "ddsdfas"
            }
        }
    }
    */
    const mutation = `mutation CreateJob($input: CreateJobInput) {
        job: createJob(input: $input) {
            id
            title
            company {
                id
                name
            }
        }
    }`
    // we are using {input} to send object as {input: {title: "dgsd", ...}}
    const data = await graphqlRequest(mutation, {input});
    return data.job;
}