import React from 'react';

export class AppLoadBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div role="alert" className="p-6 text-white/80">
          <p>This app could not load. Reload the desktop to try again.</p>
          <button className="mt-3 underline" onClick={() => window.location.reload()}>
            Reload desktop
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
