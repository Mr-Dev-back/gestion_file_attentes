import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * Workaround for React DOM manipulation errors caused by browser extensions
 * (Google Translate, ad blockers, Grammarly, etc.) that modify the DOM
 * outside of React's control.
 * 
 * See: https://github.com/facebook/react/issues/11538
 */
if (typeof Node.prototype.removeChild === 'function') {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (console?.warn) {
        console.warn('Cannot remove child: node is not a child of this node.', child, this);
      }
      return child;
    }
    return originalRemoveChild.apply(this, [child]) as T;
  };
}

if (typeof Node.prototype.insertBefore === 'function') {
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console?.warn) {
        console.warn('Cannot insert before: reference node is not a child of this node.', referenceNode, this);
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, [newNode, referenceNode]) as T;
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
