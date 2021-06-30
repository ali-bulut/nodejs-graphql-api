import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from 'apollo-boost';
import { gql } from 'graphql-tag';
import { getAccessToken, isLoggedIn } from "./auth";

const endpointUrl = "http://localhost:9000/graphql";

const authLink = new ApolloLink((operation, forward) => {
    if(isLoggedIn())
    {
        operation.setContext({
            headers: {
                "authorization": `Bearer ${getAccessToken()}`
            }
        })
    }
    return forward(operation);
})

const client = new ApolloClient({
    link: ApolloLink.from([
        authLink,
        new HttpLink({uri: endpointUrl})
    ]),
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
    // gql parsing the string into an object that represents the GraphQL query.
    const query = gql`{
        jobs{
            id
            title
            company{
                id
                name
            }
        }
    }`
    const { data } = await client.query({query});
    // const data = await graphqlRequest(query);
    return data.jobs;
}

export const loadJob = async (id) => {
    const query = gql`query JobQuery($id: ID!) {
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
    const { data } = await client.query({query, variables: { id }});
    // const data = await graphqlRequest(query, {id});
    return data.job;
}

export const loadCompany = async (id) => {
    const query = gql`query CompanyQuery($id: ID!) {
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
    const { data } = await client.query({query, variables: { id }});
    // const data = await graphqlRequest(query, {id});
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
    const mutation = gql`mutation CreateJob($input: CreateJobInput) {
        job: createJob(input: $input) {
            id
            title
            company {
                id
                name
            }
        }
    }`
    const { data } = await client.mutate({mutation, variables: { input }});
    // we are using {input} to send object as {input: {title: "dgsd", ...}}
    // const data = await graphqlRequest(mutation, {input});
    return data.job;
}