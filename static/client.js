const socket = io()

let state = {}

const setState = updates => {
  Object.assign(state, updates)
  ReactDOM.render(React.createElement(Root, state), document.getElementById('root'))
}

socket.on('to_client', (data) => {
  console.log("Python Server said: ")
  console.log(data)
  setState({msgList: [...state.msgList, data]})
})

const handleSubmit = ev => {
  ev.preventDefault()
  socket.emit('to_server', state.message)
  setState({message: ''})
}

const Root = ({message, msgList}) =>
  React.createElement('form', {onSubmit: handleSubmit},
    React.createElement('input', {
      value: message, type: 'text',
      onChange: ev => setState({message: ev.target.value})
    }),
    React.createElement('input', {type: 'submit', value: 'Send'}),
    msgList.map(msg => React.createElement('div', null, msg)))

setState({message: '', msgList: []})
