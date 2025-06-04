import React from 'react';

/**
 * GlobalStylesDemo Component
 * 
 * This component demonstrates the global styles implemented for the Narraitor application.
 * It uses semantic HTML structure with proper heading hierarchy and demonstrates various 
 * HTML elements that are styled by the global CSS.
 */
export const GlobalStylesDemo = () => {
  return (
    <main className="container">
      <header>
        <h1>Narraitor Global Styles</h1>
        <p>This component demonstrates the global styles for the Narraitor application.</p>
      </header>
      
      <section>
        <h2>Typography</h2>
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <h4>Heading 4</h4>
        <h5>Heading 5</h5>
        <h6>Heading 6</h6>
        <p>This is a paragraph of text. It demonstrates the default paragraph styling in the application.</p>
        <p>Here is a paragraph with a <a href="#">link</a> styled according to the global styles.</p>
        <p><strong>Bold text</strong> and <em>italic text</em> for emphasis.</p>
        <p>Code snippet: <code>const element = document.querySelector(&apos;.selector&apos;);</code></p>
      </section>
      
      <section>
        <h2>Lists</h2>
        <h3>Unordered List</h3>
        <ul>
          <li>First item</li>
          <li>Second item</li>
          <li>Third item with <a href="#">a link</a></li>
        </ul>
        
        <h3>Ordered List</h3>
        <ol>
          <li>First item</li>
          <li>Second item</li>
          <li>Third item with <strong>bold text</strong></li>
        </ol>
      </section>
      
      <section>
        <h2>Form Elements</h2>
        <form>
          <div className="form-group">
            <label htmlFor="text-input">Text Input</label>
            <input type="text" id="text-input" placeholder="Enter text..." />
          </div>
          
          <div className="form-group">
            <label htmlFor="select-input">Select Input</label>
            <select id="select-input">
              <option value="">Select an option</option>
              <option value="1">Option 1</option>
              <option value="2">Option 2</option>
              <option value="3">Option 3</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="textarea">Text Area</label>
            <textarea id="textarea" rows={3} placeholder="Enter multiple lines of text..."></textarea>
          </div>
          
          <button type="button" className="btn btn-primary">Primary Button</button>
          <button type="button" className="btn btn-secondary">Secondary Button</button>
          <button type="button" className="btn btn-accent">Accent Button</button>
        </form>
      </section>
      
      <section>
        <h2>Tables</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Item 1</td>
              <td>Type A</td>
              <td>Description of item 1</td>
            </tr>
            <tr>
              <td>Item 2</td>
              <td>Type B</td>
              <td>Description of item 2</td>
            </tr>
            <tr>
              <td>Item 3</td>
              <td>Type A</td>
              <td>Description of item 3</td>
            </tr>
          </tbody>
        </table>
      </section>
      
      <section>
        <h2>Custom Components</h2>
        <div className="card">
          <h3>Card Component</h3>
          <p>This is a simple card component using the custom card class defined in the global styles.</p>
          <button type="button" className="btn btn-primary">Action</button>
        </div>
      </section>
      
      <footer>
        <hr />
        <p>This component showcases the global styles for the Narraitor application.</p>
      </footer>
    </main>
  );
};

export default GlobalStylesDemo;
