import React, { Component, createElement, createRef, RefObject } from "react";
import { Navigator } from "react-onsenui";
import { TileInit, GoToErrorPage } from "./services/helper.svc";
import { tile } from "./services/container.svc";
import LoadingScreen from "./components/LoadingScreen";

class App extends Component<any, any> {
  // create a reference to the onsen Navigator
  navEl: RefObject<Navigator> = createRef();
  state = {
    loading: true
  };

  /* only render the onsen navigator
    Let the tileInit decide what to do
   */
  render() {
    const renderPage = (route: any, appNavigator: Navigator) => {
      // @ts-ignore
      if (!appNavigator.clone) {
        appNavigator = this.initTileAndNavigatorForPlatform(appNavigator);
      }

      const props = route.props || {};
      props.navigator = appNavigator;

      return createElement(route.component, props);
    };

    return (
      <>
        <Navigator id="AppNavigator" key="AppNavigator" renderPage={renderPage} ref={this.navEl} />
        {this.state.loading && <LoadingScreen />}
      </>
    );
  }

  navigationHooksApplied = false;

  removePortalBackVisibleClass = () => {
    try {
      const selectors = [
        '#navigation-container #tile-nav-container',
        '#tile-nav-container',
        '#content-tilehtml'
      ];
      // Since window.parent.document throws CORS, we try to use container.tile.navigation
      // Wait, if it throws CORS, this document.querySelectorAll won't do anything because 
      // the class is in the portal. But we leave it here just in case.
      document.querySelectorAll(selectors.join(',')).forEach((element) => {
        if (element.classList && element.classList.contains('backVisible')) {
          element.classList.remove('backVisible');
        }
      });
    } catch (e) {
      console.warn('Failed to remove backVisible class', e);
    }
  };

  componentDidMount() {
    // Attempt immediate removal
    this.removePortalBackVisibleClass();

    // Periodically try to remove it just in case
    const interval = setInterval(() => {
      this.removePortalBackVisibleClass();
    }, 250);

    // Failsafe to stop interval after 5 seconds
    setTimeout(() => clearInterval(interval), 5000);

    const nav = this.navEl.current;
    if (nav) {
      this.waitForCDPGlobals()
        .then(() => TileInit(nav))
        .then(
          () => {
            this.setState({ loading: false });
          },
          () => {
            this.setState({ loading: false });
            GoToErrorPage(nav);
          }
        );
    }
  }

  waitForCDPGlobals(timeoutMs = 1000, pollMs = 50): Promise<void> {
    const started = Date.now();
    return new Promise((resolve) => {
      const tick = () => {
        const c: any = (window as any).container;
        const ready =
          !!c &&
          !!c.tile &&
          !!c.tile.data &&
          typeof c.tile.data.getTileConfig === "function" &&
          !!c.connectors;

        if (ready) {
          resolve();
          return;
        }

        if (Date.now() - started >= timeoutMs) {
          // Continue anyway; TileInit will handle failure paths.
          resolve();
          return;
        }

        setTimeout(tick, pollMs);
      };
      tick();
    });
  }

  /* set up the react onsen nav to play nice with the container nav
   */
  initTileAndNavigatorForPlatform(appNavigator: Navigator): any {
    // This is exists to prevent promises from not resolving with the container

    // @ts-ignore
    appNavigator.clone = appNavigator._navi;

    // @ts-ignore
    appNavigator.clone.pushPage = () => {
      return undefined;
    };

    // @ts-ignore
    tile.popPanel = () => {
      appNavigator.popPage().then(() => undefined);
    };

    return appNavigator;
  }
}

export default App;
