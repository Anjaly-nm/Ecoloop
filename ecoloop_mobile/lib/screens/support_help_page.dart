import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class SupportHelpPage extends StatelessWidget {
  const SupportHelpPage({super.key});

  Future<void> _launchEmail(BuildContext context) async {
    const email = 'support@ecoloop.com';
    final uri = Uri(scheme: 'mailto', path: email);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Email: $email')),
        );
      }
    }
  }

  Future<void> _launchPhone(BuildContext context) async {
    const phone = '+918606878986';
    final uri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Call: $phone')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Support & Help'),
        backgroundColor: Colors.green.shade800,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Icon(Icons.headset_mic, size: 64, color: Colors.green.shade700),
            const SizedBox(height: 16),
            const Text(
              'We\'re here to help',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Contact the EcoLoop team for delivery partner support, route issues, or any questions.',
              style: TextStyle(color: Colors.grey.shade700),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: ListTile(
                leading: const Icon(Icons.email, color: Colors.green),
                title: const Text('Email support'),
                subtitle: const Text('support@ecoloop.com'),
                onTap: () => _launchEmail(context),
              ),
            ),
            const SizedBox(height: 10),
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: ListTile(
                leading: const Icon(Icons.phone, color: Colors.green),
                title: const Text('Call support'),
                subtitle: const Text('+91 8606878986'),
                onTap: () => _launchPhone(context),
              ),
            ),
            const SizedBox(height: 32),
            const Text('Frequently asked', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            _faqTile('How do I update my route status?', 'Use "Start Delivery" on a pending order, then "Complete" when done.'),
            _faqTile('Who do I contact for leave?', 'Use Apply Leave from the menu. Your status appears under My Leave Status.'),
            _faqTile('What if I cannot deliver on a day?', 'Go to Weekly Availability and turn off that day.'),
          ],
        ),
      ),
    );
  }

  Widget _faqTile(String q, String a) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ExpansionTile(
        title: Text(q, style: const TextStyle(fontWeight: FontWeight.w500)),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Text(a, style: TextStyle(color: Colors.grey.shade700)),
          ),
        ],
      ),
    );
  }
}
