'use client';

import { useState } from 'react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardBody,
  CardFooter,
  Input, 
  TextArea,
  Select, 
  Badge, 
  Modal,
  ConfirmModal,
  Alert, 
  Avatar,
  AvatarGroup,
  Table,
  Pagination,
  EmptyState,
  Loading,
  ErrorState,
  Column
} from '@/components/ui';
import { 
  Plus, 
  Mail, 
  Search, 
  Users,
  Download,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

export default function ComponentsShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [alertVisible, setAlertVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState<string>('buttons');

  // Sample data for table
  const sampleMembers = [
    { id: 1, name: 'John Mwanga', email: 'john@example.com', role: 'Pastor', status: 'Active' },
    { id: 2, name: 'Grace Ndosi', email: 'grace@example.com', role: 'Member', status: 'Active' },
    { id: 3, name: 'David Kilima', email: 'david@example.com', role: 'Youth Leader', status: 'Active' },
  ];

  const tableColumns: Column<typeof sampleMembers[0]>[] = [
    { key: 'name', header: 'Name', align: 'left' },
    { key: 'email', header: 'Email', align: 'left' },
    { 
      key: 'role', 
      header: 'Role', 
      align: 'center',
      render: (row) => <Badge variant="primary">{row.role}</Badge>
    },
    { 
      key: 'status', 
      header: 'Status', 
      align: 'center',
      render: (row) => <Badge variant="success" dot>{row.status}</Badge>
    },
  ];

  const sections = [
    { id: 'buttons', label: 'Buttons' },
    { id: 'cards', label: 'Cards' },
    { id: 'forms', label: 'Form Inputs' },
    { id: 'badges', label: 'Badges & Avatars' },
    { id: 'modals', label: 'Modals & Alerts' },
    { id: 'tables', label: 'Tables' },
    { id: 'states', label: 'States' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">UI Components Showcase</h1>
              <p className="text-sm text-gray-600 mt-1">FCC Church Management System</p>
            </div>
            <Link 
              href="/dashboard"
              className="px-4 py-2 text-fcc-blue-600 hover:bg-fcc-blue-50 rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setSelectedTab(section.id)}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                selectedTab === section.id
                  ? 'bg-fcc-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Buttons Section */}
        {selectedTab === 'buttons' && (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Button Variants" subtitle="Different button styles for various actions" />
              <CardBody>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                    <Button variant="danger">Danger Button</Button>
                    <Button variant="success">Success Button</Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Button Sizes" subtitle="Small, medium, and large sizes" />
              <CardBody>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small Button</Button>
                  <Button size="md">Medium Button</Button>
                  <Button size="lg">Large Button</Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Button States & Icons" subtitle="Loading states and icon combinations" />
              <CardBody>
                <div className="flex flex-wrap gap-3">
                  <Button loading>Loading...</Button>
                  <Button icon={<Plus className="h-4 w-4" />}>Add Member</Button>
                  <Button variant="outline" icon={<Download className="h-4 w-4" />}>Download</Button>
                  <Button variant="danger" icon={<Trash2 className="h-4 w-4" />}>Delete</Button>
                  <Button disabled>Disabled Button</Button>
                  <Button fullWidth>Full Width Button</Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Cards Section */}
        {selectedTab === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader title="Default Card" subtitle="Standard card style" />
              <CardBody>
                <p className="text-gray-600">This is a default card with white background and subtle border.</p>
              </CardBody>
            </Card>

            <Card variant="gradient">
              <CardHeader title="Gradient Card" subtitle="Card with gradient background" />
              <CardBody>
                <p className="text-gray-600">This card has a subtle blue gradient background.</p>
              </CardBody>
            </Card>

            <Card variant="bordered">
              <CardHeader title="Bordered Card" subtitle="Card with prominent border" />
              <CardBody>
                <p className="text-gray-600">This card has a thicker, more visible border.</p>
              </CardBody>
            </Card>

            <Card hover>
              <CardHeader title="Hoverable Card" subtitle="Interactive card with hover effect" />
              <CardBody>
                <p className="text-gray-600">Hover over this card to see the shadow effect.</p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader 
                title="Card with Action" 
                subtitle="Header includes action button"
                action={<Button size="sm" variant="outline">Action</Button>}
              />
              <CardBody>
                <p className="text-gray-600">Cards can have action buttons in the header.</p>
              </CardBody>
              <CardFooter>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm">Cancel</Button>
                  <Button size="sm">Save</Button>
                </div>
              </CardFooter>
            </Card>

            <Card padding="lg">
              <CardHeader title="Large Padding" subtitle="Extra spacious card" />
              <CardBody>
                <p className="text-gray-600">This card has larger padding for more breathing room.</p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Forms Section */}
        {selectedTab === 'forms' && (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Text Inputs" subtitle="Various input field configurations" />
              <CardBody>
                <div className="space-y-4 max-w-2xl">
                  <Input 
                    label="Full Name" 
                    placeholder="Enter your full name"
                    fullWidth
                  />
                  <Input 
                    label="Email Address" 
                    type="email"
                    placeholder="your.email@example.com"
                    icon={<Mail className="h-5 w-5" />}
                    helperText="We'll never share your email"
                    fullWidth
                  />
                  <Input 
                    label="Search Members" 
                    placeholder="Search..."
                    icon={<Search className="h-5 w-5" />}
                    iconPosition="left"
                    fullWidth
                  />
                  <Input 
                    label="Phone Number" 
                    error="Please enter a valid phone number"
                    fullWidth
                  />
                  <TextArea 
                    label="Message" 
                    placeholder="Enter your message here..."
                    rows={4}
                    helperText="Maximum 500 characters"
                    fullWidth
                  />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Select Dropdowns" subtitle="Dropdown selection fields" />
              <CardBody>
                <div className="space-y-4 max-w-2xl">
                  <Select
                    label="Department"
                    options={[
                      { value: 'youth', label: 'Youth Ministry (VIJANA)' },
                      { value: 'women', label: 'Women\'s Ministry (WAWATA)' },
                      { value: 'men', label: 'Men\'s Ministry (WAUME)' },
                      { value: 'children', label: 'Children\'s Ministry (WATOTO)' },
                    ]}
                    placeholder="Select a department"
                    fullWidth
                  />
                  <Select
                    label="Role"
                    options={[
                      { value: 'member', label: 'Member' },
                      { value: 'leader', label: 'Department Leader' },
                      { value: 'pastor', label: 'Pastor' },
                      { value: 'admin', label: 'Administrator' },
                    ]}
                    helperText="Select the appropriate role"
                    fullWidth
                  />
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Badges & Avatars Section */}
        {selectedTab === 'badges' && (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Badge Variants" subtitle="Different badge colors and styles" />
              <CardBody>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="primary">Primary</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="danger">Danger</Badge>
                    <Badge variant="info">Info</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="success" dot>Online</Badge>
                    <Badge variant="danger" dot>Offline</Badge>
                    <Badge variant="warning" dot>Away</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge size="sm">Small</Badge>
                    <Badge size="md">Medium</Badge>
                    <Badge size="lg">Large</Badge>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Avatars" subtitle="User profile pictures and placeholders" />
              <CardBody>
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <Avatar name="John Doe" size="xs" />
                    <Avatar name="Grace Smith" size="sm" />
                    <Avatar name="David Johnson" size="md" />
                    <Avatar name="Mary Wilson" size="lg" />
                    <Avatar name="Pastor Paul" size="xl" />
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <Avatar name="Online User" status="online" size="md" />
                    <Avatar name="Away User" status="away" size="md" />
                    <Avatar name="Busy User" status="busy" size="md" />
                    <Avatar name="Offline User" status="offline" size="md" />
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <Avatar name="John Doe" variant="circle" size="md" />
                    <Avatar name="Jane Smith" variant="rounded" size="md" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Avatar Group</p>
                    <AvatarGroup
                      avatars={[
                        { name: 'John Doe' },
                        { name: 'Jane Smith' },
                        { name: 'Bob Johnson' },
                        { name: 'Alice Williams' },
                        { name: 'Charlie Brown' },
                      ]}
                      max={3}
                      size="md"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Modals & Alerts Section */}
        {selectedTab === 'modals' && (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Modals" subtitle="Dialog windows for user interactions" />
              <CardBody>
                <div className="flex gap-3">
                  <Button onClick={() => setIsModalOpen(true)}>
                    Open Modal
                  </Button>
                  <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
                    Open Confirm Dialog
                  </Button>
                </div>

                <Modal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  title="Example Modal"
                  description="This is a demonstration of the modal component"
                  footer={
                    <>
                      <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsModalOpen(false)}>
                        Save Changes
                      </Button>
                    </>
                  }
                >
                  <div className="space-y-4">
                    <p className="text-gray-700">
                      This is the modal body. You can put any content here including forms, 
                      images, or other components.
                    </p>
                    <Input label="Name" placeholder="Enter name" fullWidth />
                    <Select
                      label="Department"
                      options={[
                        { value: 'youth', label: 'Youth Ministry' },
                        { value: 'women', label: 'Women\'s Ministry' },
                      ]}
                      fullWidth
                    />
                  </div>
                </Modal>

                <ConfirmModal
                  isOpen={isConfirmOpen}
                  onClose={() => setIsConfirmOpen(false)}
                  onConfirm={() => {
                    alert('Confirmed!');
                    setIsConfirmOpen(false);
                  }}
                  title="Confirm Deletion"
                  message="Are you sure you want to delete this item? This action cannot be undone."
                  variant="danger"
                  confirmText="Delete"
                  cancelText="Cancel"
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Alerts" subtitle="Contextual feedback messages" />
              <CardBody>
                <div className="space-y-4">
                  <Alert variant="info" title="Information">
                    This is an informational alert message.
                  </Alert>
                  <Alert variant="success" title="Success!">
                    Your changes have been saved successfully.
                  </Alert>
                  <Alert variant="warning" title="Warning">
                    Please review your input before proceeding.
                  </Alert>
                  <Alert variant="error" title="Error">
                    An error occurred while processing your request.
                  </Alert>
                  {alertVisible && (
                    <Alert 
                      variant="info" 
                      title="Dismissible Alert"
                      onClose={() => setAlertVisible(false)}
                    >
                      This alert can be dismissed by clicking the X button.
                    </Alert>
                  )}
                  {!alertVisible && (
                    <Button size="sm" onClick={() => setAlertVisible(true)}>
                      Show Dismissible Alert
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Tables Section */}
        {selectedTab === 'tables' && (
          <div className="space-y-6">
            <Card padding="none">
              <div className="p-6">
                <CardHeader title="Data Table" subtitle="Displaying tabular data with styling" />
              </div>
              <Table
                data={sampleMembers}
                columns={tableColumns}
                hoverable
                bordered
                onRowClick={(row) => alert(`Clicked: ${row.name}`)}
              />
              <div className="p-6 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={10}
                  onPageChange={setCurrentPage}
                />
              </div>
            </Card>

            <Card padding="none">
              <div className="p-6">
                <CardHeader title="Loading State" subtitle="Table with skeleton loading" />
              </div>
              <Table
                data={[]}
                columns={tableColumns}
                loading
              />
            </Card>

            <Card padding="none">
              <div className="p-6">
                <CardHeader title="Empty State" subtitle="Table with no data" />
              </div>
              <Table
                data={[]}
                columns={tableColumns}
                emptyMessage="No members found. Add your first member to get started."
              />
            </Card>
          </div>
        )}

        {/* States Section */}
        {selectedTab === 'states' && (
          <div className="space-y-6">
            <Card>
              <EmptyState
                title="No Members Yet"
                description="Get started by adding your first church member to the system."
                action={{
                  label: 'Add Member',
                  onClick: () => alert('Add member clicked'),
                  icon: <Plus className="h-4 w-4" />
                }}
              />
            </Card>

            <Card>
              <Loading text="Loading church members..." size="lg" />
            </Card>

            <Card>
              <ErrorState
                title="Failed to Load Data"
                message="We couldn't load the church members. Please check your connection and try again."
                onRetry={() => alert('Retry clicked')}
              />
            </Card>

            <Card>
              <EmptyState
                icon={<Users className="h-12 w-12 text-gray-400" />}
                title="No Events Scheduled"
                description="There are no upcoming events. Schedule your next church event."
                action={{
                  label: 'Schedule Event',
                  onClick: () => alert('Schedule event clicked'),
                  icon: <Plus className="h-4 w-4" />
                }}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
