const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(express.json())

const customers = []

// Middleware
function verifyAccountDocument(req, res, next){
    const { document } = req.headers
    
    const customer = customers.find((customer) => customer.document === document)

    if (!customer) {
        return res.status(400).json({ error: 'Customer not found' })
    }

    req.customer = customer

    return next()
}

function getBalance(statement){
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount
        }         
        return acc - operation.amount       
    }, 0)

    return balance
}

app.get('/statement', verifyAccountDocument, (req, res) => {
    const { customer } = req
    return res.json(customer.statement)
})

app.post('/account', (req, res) => {
    const { name, document } = req.body

    const customerAlreadyExists = customers.some((customer) => 
        customer.document === document)

    if (customerAlreadyExists) {
        return res.status(400).json({ error: 'Customer already exists' })
    }   

    customers.push({
        document,
        name,
        id: uuidv4(),
        statement: [],
    })

    return res.status(201).send()
})

app.post('/deposit', verifyAccountDocument, (req, res) => {
    const { description, amount } = req.body
    const { customer } = req

    const statementOperations = {
        description,
        amount,
        created_at: new Date(),
        type: 'credit'
    }

    customer.statement.push(statementOperations)

    return res.status(201).send()
})

app.post('/withdraw', verifyAccountDocument, (req, res) => {
    const { amount } = req.body
    const { customer } = req

    const balance = getBalance(customer.statement)

    if (balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' })
    }  

    const statementOperations = {       
        amount,
        created_at: new Date(),
        type: 'debit'
    }

    customer.statement.push(statementOperations)

    return res.status(201).send()
})

app.get('/statement/date', verifyAccountDocument, (req, res) => {
    const { customer } = req
    const { date } = req.query

    const dateFormatted = new Date(date + '00:00')

    const statement = customer.statement.filter(statement => 
        statement.created_at.toDateString() == 
        new Date(dateFormatted).toDateString())

    return res.json(customer.statement)
})

app.put('/account', verifyAccountDocument, (req, res) => {
    const { name } = req.body
    const { customer } = req

    customer.name = name

    return res.status(201).send()
})

app.get('/account', verifyAccountDocument, (req, res) => {
    const { customer } = req

    return res.json(customer)
})

app.delete('/account', verifyAccountDocument, (req, res) => {
    const { customer } = req

    customers.splice(customer, 1)

    return res.status(200).json(customers)
})

app.get('/balance', verifyAccountDocument, (req, res) => {
    const { customer } = req

    const balance = getBalance(customer.statement)

    return res.json({ balance })
})

app.listen(3333);