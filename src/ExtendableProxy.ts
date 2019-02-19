export default class ExtendableProxy {
  public constructor(target, proxyHandler: ProxyHandler<any>) {
    return new Proxy(target, proxyHandler)
  }
}
