import { Component } from '@angular/core';

@Component({
    selector: 'app-branding',
    template: `
    <div class="branding">
      <a href="/">
        <img
          src="./assets/images/logos/logoach.png"
          class="align-middle m-2"
          alt="logo"
        />
      </a>
    </div>
  `,
    standalone: false
})
export class BrandingComponent {
  constructor() {}
}
