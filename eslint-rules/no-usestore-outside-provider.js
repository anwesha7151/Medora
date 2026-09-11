/**
 * Flags `useStore()` usage in modules that cannot be rendered inside
 * <AppStoreProvider> (the provider is mounted in src/routes/__root.tsx around
 * <Outlet />), and usage outside of a React component/hook function.
 *
 * ESLint cannot see the runtime React tree, so this rule enforces the two
 * statically-checkable invariants that cause the
 * "useStore must be used inside <AppStoreProvider>" runtime error.
 */

const OUTSIDE_PROVIDER_PATTERNS = [
  {
    re: /\.server\.[tj]sx?$/,
    why: "server-only modules never render inside the provider",
  },
  {
    re: /\.functions\.[tj]sx?$/,
    why: "server functions never render inside the provider",
  },
  {
    re: /[/\\]routes[/\\]api[/\\]/,
    why: "API route handlers never render inside the provider",
  },
  { re: /[/\\]lib[/\\]mcp[/\\]/, why: "MCP tools run outside the React tree" },
  {
    re: /[/\\]routes[/\\]__root\.tsx$/,
    why: "__root.tsx renders <AppStoreProvider> itself, so its own components sit outside it",
  },
  {
    re: /[/\\]components[/\\]common[/\\]AppErrorBoundary\.tsx$/,
    why: "the error boundary must keep working when the provider is missing",
  },
];

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow useStore() where <AppStoreProvider> is not guaranteed above it",
    },
    schema: [],
    messages: {
      outsideProviderFile:
        "`useStore()` cannot be used in this file: {{why}}. Read the data from props or a server call instead.",
      notInComponent:
        "`useStore()` must be called at the top level of a React component or a `use*` hook, not in `{{name}}`.",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    const fileViolation = OUTSIDE_PROVIDER_PATTERNS.find((p) =>
      p.re.test(filename),
    );

    function enclosingFunctionName(node) {
      let scope = node;
      while (scope) {
        if (
          scope.type === "FunctionDeclaration" ||
          scope.type === "FunctionExpression" ||
          scope.type === "ArrowFunctionExpression"
        ) {
          if (scope.id?.name) return scope.id.name;
          const parent = scope.parent;
          if (parent?.type === "VariableDeclarator" && parent.id?.name)
            return parent.id.name;
          if (parent?.type === "Property" && parent.key?.name)
            return parent.key.name;
          if (parent?.type === "MethodDefinition" && parent.key?.name)
            return parent.key.name;
          return "<anonymous function>";
        }
        scope = scope.parent;
      }
      return "<module scope>";
    }

    return {
      CallExpression(node) {
        const callee = node.callee;
        const isUseStore =
          (callee.type === "Identifier" && callee.name === "useStore") ||
          (callee.type === "MemberExpression" &&
            callee.property.type === "Identifier" &&
            callee.property.name === "useStore");
        if (!isUseStore) return;

        if (fileViolation) {
          context.report({
            node,
            messageId: "outsideProviderFile",
            data: { why: fileViolation.why },
          });
          return;
        }

        const name = enclosingFunctionName(node);
        const isComponentOrHook = /^(use[A-Z0-9]|[A-Z])/.test(name);
        if (!isComponentOrHook) {
          context.report({ node, messageId: "notInComponent", data: { name } });
        }
      },
    };
  },
};

export default rule;
