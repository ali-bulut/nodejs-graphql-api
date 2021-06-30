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

const jobDetailFragment = gql`
    fragment JobDetail on Job {
        id
        title
        company {
            id
            name
        }
        description
    }
`

// gql parsing the string into an object that represents the GraphQL query.
const jobsQuery = gql`
    query JobsQuery{
        jobs{
            id
            title
            company{
                id
                name
            }
        }
    }
`

const jobQuery = gql`
    query JobQuery($id: ID!) {
        job(id: $id) {
            ...JobDetail
        }
    }
    ${jobDetailFragment}
`

const companyQuery = gql`
    query CompanyQuery($id: ID!) {
        company(id: $id) {
            id
            name
            description
            jobs {
                id
                title
            }
        }
    }
`

const createJobMutation = gql`
    mutation CreateJob($input: CreateJobInput) {
        job: createJob(input: $input) {
            ...JobDetail # fragment name here
        }
    }
    ${jobDetailFragment} # js variable name that represents fragment here.
`

export const loadJobs = async () => {
    // we set fetchPolicy as no-cache because we always want to fetch latest jobs not the cached ones. 
    // (Default fetchPolicy is cache-first => That means if there is already data in cache it won't send a new request
    // to the server and it'll use the data that is cached)
    const { data } = await client.query({query: jobsQuery, fetchPolicy: 'no-cache'});
    // const data = await graphqlRequest(query);
    return data.jobs;
}

export const loadCompany = async (id) => {
    const { data } = await client.query({query: companyQuery, variables: { id }});
    // const data = await graphqlRequest(query, {id});
    return data.company;
}

export const loadJob = async (id) => {
    const { data } = await client.query({query: jobQuery, variables: { id }});
    // const data = await graphqlRequest(query, {id});
    return data.job;
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
    const { data } = await client.mutate({
        mutation: createJobMutation, 
        variables: { input }, 
        // update is a function that will be called after the mutation has been executed.
        update: (cache, mutationResult) => {
            const data = mutationResult.data;
            // whenever we run a query with apollo-client after executing a query, apollo-client calls this writeQuery function by passing the query
            // and the data it received as response to save response data to the cache. But in this case we want to override it.
            
            // recap: this function does that tells apollo client whenever you run this mutation, take the data returned in the response 
            // and save it to the cache as if it was the result of running the jobQuery for that specific job id.
            // this way when we actually run jobQuery with that job id, it'll find the data in the cache and avoid
            // making a new call to the server.
            cache.writeQuery({
                query: jobQuery, 
                variables: {id: data.job.id},
                data
            })
        }
    });
    // we are using {input} to send object as {input: {title: "dgsd", ...}}
    // const data = await graphqlRequest(mutation, {input});
    return data.job;
}