import 'package:flutter/material.dart';
import 'package:ecoloop_mobile/screens/login_page.dart';
import 'package:ecoloop_mobile/screens/register_page.dart';
import 'package:ecoloop_mobile/screens/delivery_dashboard.dart';

void main() {
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
      },
    );
  }
}

