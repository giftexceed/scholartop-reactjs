import { Component } from 'react'

// Keeps a failing page from blanking the whole dashboard. Keyed by route in
// DashboardLayout, so navigating away resets it.
export default class ErrorBoundary extends Component {
    state = { error: null }

    static getDerivedStateFromError(error) {
        return { error }
    }

    render() {
        if (!this.state.error) return this.props.children
        return (
            <div className='card empty' role='alert'>
                <p><strong>Something went wrong loading this page.</strong></p>
                <p className='small'>{this.state.error.message}</p>
                <button className='button' style={{ marginTop: 12 }} onClick={() => this.setState({ error: null })}>Try again</button>
            </div>
        )
    }
}
