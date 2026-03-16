import 'package:flutter/material.dart';
import 'package:ecoloop_mobile/screens/login_page.dart';
import 'package:ecoloop_mobile/screens/register_page.dart';
import 'package:ecoloop_mobile/screens/delivery_dashboard.dart';
import 'package:ecoloop_mobile/screens/apply_leave_page.dart';
import 'package:ecoloop_mobile/screens/my_leave_status_page.dart';
import 'package:ecoloop_mobile/screens/weekly_availability_page.dart';
import 'package:ecoloop_mobile/screens/support_help_page.dart';
import 'package:ecoloop_mobile/screens/collector_dashboard.dart';
import 'package:ecoloop_mobile/screens/admin_smart_bin_page.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

// Handle background messages
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print("Background FCM Received: ${message.messageId}");
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  runApp(const EcoloopApp());
}

class EcoloopApp extends StatelessWidget {
  const EcoloopApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ecoloop',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        useMaterial3: true,
      ),
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginPage(),
        '/register': (context) => const RegisterPage(),
        '/delivery-dashboard': (context) => const DeliveryDashboard(),
        '/collector-dashboard': (context) => const CollectorDashboard(),
        '/apply-leave': (context) => const ApplyLeavePage(),
        '/my-leave-status': (context) => const MyLeaveStatusPage(),
        '/weekly-availability': (context) => const WeeklyAvailabilityPage(),
        '/support-help': (context) => const SupportHelpPage(),
        '/admin-smart-bin': (context) => const AdminSmartBinPage(),
      },
    );
  }
}

