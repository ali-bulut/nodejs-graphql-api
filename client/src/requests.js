const endpointUrl = "http://localhost:9000/graphql";

const graphqlRequest = async (query, variables={}) => {
    const response = await fetch(endpointUrl, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
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
