declare module 'twig' {
  interface TwigTemplate {
    render(context?: Record<string, unknown>): string;
  }
  interface TwigOptions {
    data: string;
    rethrow?: boolean;
  }
  const Twig: {
    twig(options: TwigOptions): TwigTemplate;
  };
  export default Twig;
}
