import NextLink from 'next/link';
import type { ComponentProps } from 'react';

// Load destination code on demand instead of prefetching every visible listing and navigation link.
export default function Link(props: ComponentProps<typeof NextLink>) { return <NextLink prefetch={false} {...props} />; }
