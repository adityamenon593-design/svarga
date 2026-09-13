import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface DonationReceiptProps {
  donorName?: string
  amount?: string
  paymentId?: string
  date?: string
}

export function DonationReceipt({
  donorName = 'Friend',
  amount = '₹101',
  paymentId = 'pay_XXXXXXXX',
  date = new Date().toLocaleDateString('en-IN'),
}: DonationReceiptProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Svarga.ai donation receipt</Preview>
      <Body style={{ backgroundColor: '#faf7f2', fontFamily: 'Georgia, serif', margin: 0 }}>
        <Container style={{ padding: '32px', maxWidth: '560px' }}>
          <Heading style={{ fontSize: '22px', color: '#3b2a17', margin: '0 0 8px' }}>
            Thank you, {donorName}
          </Heading>
          <Text style={{ color: '#5a4630', fontSize: '15px', lineHeight: '24px' }}>
            Your gift keeps Svarga.ai free for people who cannot pay for it. This
            email is your receipt.
          </Text>
          <Hr style={{ borderColor: '#e4d9c6' }} />
          <Section>
            <Text style={{ margin: '4px 0', color: '#3b2a17' }}>Amount: {amount}</Text>
            <Text style={{ margin: '4px 0', color: '#3b2a17' }}>Date: {date}</Text>
            <Text style={{ margin: '4px 0', color: '#3b2a17' }}>
              Payment reference: {paymentId}
            </Text>
          </Section>
          <Hr style={{ borderColor: '#e4d9c6' }} />
          <Text style={{ color: '#7a6a55', fontSize: '13px' }}>
            Svarga.ai — built in India by Aditya Mohan Menon. Questions? Reply to
            this email or write to adityamenon593@gmail.com.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: DonationReceipt,
  displayName: 'Donation receipt',
  subject: (data: Record<string, any>) =>
    `Your Svarga.ai donation receipt (${data['amount'] ?? ''})`.trim(),
  previewData: {
    donorName: 'Aditya',
    amount: '₹501',
    paymentId: 'pay_R1x2y3z4',
    date: '13 September 2026',
  },
} satisfies TemplateEntry
