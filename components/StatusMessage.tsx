import React from 'react'

interface StatusMessageProps {
  state: string
  error: string
  content: {
    [key: string]: string
  }
}

const StatusMessage: React.FC<StatusMessageProps> = ({ state, error, content }) => {
  return (
    <p className={`text-lg ${state === 'error' ? 'text-error' : 'text-base-content'}`}>
      {content[state] || ''}
    </p>
  )
}

export default StatusMessage