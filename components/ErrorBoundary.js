import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 以在下一次渲染時顯示錯誤 UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    // 你也可以將錯誤記錄到錯誤報告服務
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // 你可以渲染任何自定義的錯誤 UI
      return (
        <div className="error-boundary">
          <h2>很抱歉，出現了一些問題。</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    // 正常情況下渲染子組件
    return this.props.children;
  }
}

export default ErrorBoundary; 