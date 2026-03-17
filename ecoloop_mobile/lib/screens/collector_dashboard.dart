import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

// Use same base URL as login
const String apiBaseUrl = 'https://ecoloop-psi.vercel.app';

class CollectorDashboard extends StatefulWidget {
  const CollectorDashboard({super.key});

  @override
  State<CollectorDashboard> createState() => _CollectorDashboardState();
}

class _CollectorDashboardState extends State<CollectorDashboard> {
  int _currentIndex = 0;
  bool _isLoading = true;
  
  Map<String, dynamic>? _user;
  List<dynamic> _pickups = [];
  Map<String, dynamic>? _analytics;
  Map<String, dynamic>? _earnings;
  List<dynamic> _notifications = [];

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);
    await _loadUserFromPrefs();
    await _fetchAllData();
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _loadUserFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      setState(() => _user = jsonDecode(userStr));
    }
  }

  Future<void> _fetchAllData() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) return;

    final headers = {'token': token, 'Content-Type': 'application/json'};

    try {
      final responses = await Future.wait([
        http.get(Uri.parse('$apiBaseUrl/api/collector?filter=all'), headers: headers),
        http.get(Uri.parse('$apiBaseUrl/api/collector-dashboard/analytics'), headers: headers),
        http.get(Uri.parse('$apiBaseUrl/api/collector-dashboard/earnings'), headers: headers),
        http.get(Uri.parse('$apiBaseUrl/api/collector-dashboard/notifications'), headers: headers),
      ]);

      if (responses[0].statusCode == 200) {
        _pickups = jsonDecode(responses[0].body)['pickups'] ?? [];
      }
      if (responses[1].statusCode == 200) {
        _analytics = jsonDecode(responses[1].body)['analytics'];
      }
      if (responses[2].statusCode == 200) {
        _earnings = jsonDecode(responses[2].body)['earnings'];
      }
      if (responses[3].statusCode == 200) {
        _notifications = jsonDecode(responses[3].body)['notifications'] ?? [];
      }
    } catch (e) {
      debugPrint('Error fetching collector data: $e');
    }
  }

  Future<void> _updateStatus(String id, String status) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) return;

    try {
      final response = await http.put(
        Uri.parse('$apiBaseUrl/api/collector/$id'),
        headers: {'token': token, 'Content-Type': 'application/json'},
        body: jsonEncode({'status': status}),
      );

      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Marked as $status')),
        );
        _loadInitialData();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: Color(0xFF10B981))),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Collector Portal',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: const Color(0xFF1E293B),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadInitialData,
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: Colors.redAccent),
            onPressed: () async {
               final prefs = await SharedPreferences.getInstance();
               await prefs.clear();
               if (!mounted) return;
               Navigator.of(context).pushReplacementNamed('/login');
            },
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFF10B981),
        unselectedItemColor: Colors.grey,
        showUnselectedLabels: true,
        selectedLabelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 12),
        unselectedLabelStyle: GoogleFonts.poppins(fontSize: 12),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.calendar_today_rounded), label: 'Schedule'),
          BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_rounded), label: 'Earnings'),
          BottomNavigationBarItem(icon: Icon(Icons.notifications_active_rounded), label: 'Alerts'),
        ],
      ),
    );
  }

  Widget _buildBody() {
    switch (_currentIndex) {
      case 0: return _buildDashboard();
      case 1: return _buildSchedule();
      case 2: return _buildEarnings();
      case 3: return _buildNotifications();
      default: return _buildDashboard();
    }
  }

  Widget _buildDashboard() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Hello, ${_user?['name'] ?? 'Friend'}',
            style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
          ),
          Text(
            'Let\'s keep the city clean today!',
            style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey[600]),
          ),
          const SizedBox(height: 25),
          
          // Gas Warning (Mirroring Website logic)
          Container(
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 25),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(15),
              border: Border.all(color: Colors.red.withOpacity(0.2)),
            ),
            child: Row(
              children: [
                const Icon(Icons.warning_amber_rounded, color: Colors.red, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Safety Alert', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.red[900], fontSize: 13)),
                      Text('High gas levels detected in Ward 3. Avoid indoor areas.', style: GoogleFonts.poppins(color: Colors.red[700], fontSize: 11)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Stat Cards
          Row(
            children: [
              Expanded(child: _statCard('Total', _analytics?['total']?.toString() ?? '0', Colors.teal)),
              const SizedBox(width: 15),
              Expanded(child: _statCard('Done', _analytics?['collected']?.toString() ?? '0', Colors.blue)),
            ],
          ),
          const SizedBox(height: 15),
          Row(
            children: [
              Expanded(child: _statCard('Rate', '${_analytics?['completionRate'] ?? 0}%', Colors.amber)),
              const SizedBox(width: 15),
              Expanded(child: _statCard('Monthly', _analytics?['monthly']?.toString() ?? '0', Colors.deepPurple)),
            ],
          ),
          
          const SizedBox(height: 30),
          Text(
            'Incomplete Tasks',
            style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 15),
          _buildQuickTaskList(),
        ],
      ),
    );
  }

  Widget _statCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: color.withOpacity(0.05), blurRadius: 10, spreadRadius: 2),
        ],
        border: Border.all(color: color.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey[500])),
          const SizedBox(height: 5),
          Text(value, style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  Widget _buildQuickTaskList() {
    final pending = _pickups.where((p) => p['status'] != 'collected').toList();
    if (pending.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(30),
          child: Text('All tasks completed! 🎉', style: GoogleFonts.poppins(color: Colors.grey)),
        ),
      );
    }
    return Column(
      children: pending.take(5).map((p) => _pickupCard(p)).toList(),
    );
  }

  Widget _buildSchedule() {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: _pickups.length,
      itemBuilder: (context, index) => _pickupCard(_pickups[index]),
    );
  }

  Widget _pickupCard(dynamic p) {
    final bool isDone = p['status'] == 'collected';
    final user = p['user_id'];
    
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDone ? Colors.green.withOpacity(0.2) : Colors.grey.withOpacity(0.1)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: isDone ? Colors.green[50] : Colors.amber[50],
                child: Icon(
                  isDone ? Icons.check_circle_rounded : Icons.pending_actions_rounded,
                  color: isDone ? Colors.green : Colors.amber[700],
                ),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user?['name'] ?? 'Unknown User',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    Text(
                      'Ward ${user?['wardNumber'] ?? '—'} • House ${user?['houseNumber'] ?? '—'}',
                      style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
              if (!isDone) ...[
                const SizedBox(width: 8),
                IconButton(
                  onPressed: () async {
                    final address = 'Ward ${user?['wardNumber']}, House ${user?['houseNumber']}, Kerala, India';
                    final uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(address)}');
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri);
                    }
                  },
                  icon: const Icon(Icons.map_outlined, color: Colors.blue),
                  tooltip: 'Navigate',
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () => _updateStatus(p['_id'], 'collected'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  child: const Text('Done'),
                ),
              ],
            ],
          ),
          if (p['category_id'] != null) ...[
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 10),
              child: Divider(height: 1),
            ),
            Row(
              children: [
                const Icon(Icons.eco_rounded, size: 14, color: Colors.green),
                const SizedBox(width: 5),
                Text(
                  p['category_id']['name'] ?? 'Waste',
                  style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green[700]),
                ),
                const Spacer(),
                const Icon(Icons.calendar_month_rounded, size: 14, color: Colors.grey),
                const SizedBox(width: 5),
                Text(
                  p['scheduled_date'] != null 
                    ? DateTime.parse(p['scheduled_date']).toString().split(' ')[0]
                    : '—',
                  style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildEarnings() {
    final e = _earnings;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(30),
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF0D3B31), Color(0xFF10B981)]),
              borderRadius: BorderRadius.circular(30),
              boxShadow: [BoxShadow(color: const Color(0xFF10B981).withOpacity(0.3), blurRadius: 20)],
            ),
            child: Column(
              children: [
                Text('Total Earnings', style: GoogleFonts.poppins(color: Colors.white70, fontSize: 14)),
                const SizedBox(height: 10),
                Text('₹${e?['totalEarnings'] ?? '0'}', style: GoogleFonts.poppins(color: Colors.white, fontSize: 40, fontWeight: FontWeight.bold)),
                const SizedBox(height: 25),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _earnItem('Base', e?['baseSalary']?.toString() ?? '0'),
                    _earnItem('Incentive', e?['incentiveEarned']?.toString() ?? '0'),
                    _earnItem('Tasks', e?['completedCollections']?.toString() ?? '0'),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 30),
          _infoRow(Icons.card_giftcard_rounded, 'Bonus Eligible', e?['bonusEligible'] == true ? 'Yes' : 'No (Need 50+)'),
          _infoRow(Icons.account_balance_rounded, 'Payment Status', 'Processed on 1st'),
        ],
      ),
    );
  }

  Widget _earnItem(String label, String value) {
    return Column(
      children: [
        Text(value, style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        Text(label, style: GoogleFonts.poppins(color: Colors.white60, fontSize: 11)),
      ],
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(15)),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF10B981)),
          const SizedBox(width: 15),
          Text(label, style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
          const Spacer(),
          Text(value, style: GoogleFonts.poppins(color: Colors.grey[600], fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildNotifications() {
    if (_notifications.isEmpty) {
      return Center(child: Text('No new alerts', style: GoogleFonts.poppins(color: Colors.grey)));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: _notifications.length,
      itemBuilder: (context, index) {
        final n = _notifications[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(15),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(15), border: Border.all(color: Colors.grey[100]!)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(n['title'] ?? 'Alert', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 5),
              Text(n['message'] ?? '', style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey[700])),
            ],
          ),
        );
      },
    );
  }
}
