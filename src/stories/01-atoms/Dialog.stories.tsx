import type { Meta } from '@storybook/react';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

const meta: Meta = {
  title: 'Narraitor/UI/Dialog',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A modal dialog component built on Radix UI with customizable content and controls.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

export const Basic = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline">Open Dialog</Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Basic Dialog</DialogTitle>
        <DialogDescription>
          This is a basic dialog with a title, description, and footer buttons.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <p className="text-sm text-gray-600">
          Dialog content goes here. You can add any content you need.
        </p>
      </div>
      <DialogFooter>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const WithoutCloseButton = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline">Open Dialog</Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Dialog without Close Button</DialogTitle>
        <DialogDescription>
          This dialog has the default close button hidden and must be closed via the footer buttons.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <p className="text-sm text-gray-600">
          Custom dialogs can hide the default close button for more control over user interactions.
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button type="submit">Confirm</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const WithForm = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline">Edit Profile</Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogDescription>
          Make changes to your profile here. Click save when you&apos;re done.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="name" className="text-right">
            Name
          </label>
          <input
            id="name"
            defaultValue="Pedro Duarte"
            className="col-span-3 border rounded px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="username" className="text-right">
            Username
          </label>
          <input
            id="username"
            defaultValue="@peduarte"
            className="col-span-3 border rounded px-3 py-2"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const LargeContent = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline">View Terms</Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
      <DialogHeader>
        <DialogTitle>Terms and Conditions</DialogTitle>
        <DialogDescription>
          Please read our terms and conditions carefully.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 max-h-[400px] overflow-y-auto">
        <div className="space-y-4 text-sm text-gray-600">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
            veniam, quis nostrud exercitation ullamco laboris.
          </p>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
            dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
            proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
          <p>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
            doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
            veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </p>
          <p>
            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit,
            sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
          </p>
          <p>
            At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis
            praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias
            excepturi sint occaecati cupiditate non provident.
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline">Decline</Button>
        <Button type="submit">Accept</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const CustomStyling = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline">Special Dialog</Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <DialogHeader>
        <DialogTitle className="text-purple-800">Magic Portal</DialogTitle>
        <DialogDescription className="text-purple-600">
          You have discovered a mystical portal with ancient energies swirling within.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 text-center">
        <div className="text-6xl mb-4">🌀</div>
        <p className="text-sm text-purple-700">
          Do you dare to step through and discover what lies beyond?
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline">Stay Back</Button>
        <Button className="bg-purple-600 hover:bg-purple-700">Enter Portal</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);