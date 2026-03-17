import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const String apiBaseUrl = 'https://ecoloop-psi.vercel.app';

class MyLeaveStatusPage extends StatefulWidget {
  const MyLeaveStatusPage({super.key});

  @override
  State<MyLeaveStatusPage> createState() => _MyLeaveStatusPageState();
}

class _MyLeaveStatusPageState extends State<MyLeaveStatusPage> {
  String? _userId;
  bool _loading = true;
  List<dynamic> _applications = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadUserAndLeave();
  }

  Future<void> _loadUserAndLeave() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr == null) {
      setState(() {
        _loading = false;
        _error = 'Not logged in';
      });
      return;
    }
    final user = jsonDecode(userStr) as Map<String, dynamic>;
    final userId = user['id']?.toString();
    if (userId == null) {
      setState(() {
        _loading = false;
        _error = 'User id not found';
      });
      return;
    }
    setState(() => _userId = userId);

    final token = prefs.getString('token');
    try {
      final response = await http.get(
        Uri.parse('$apiBaseUrl/api/leave-applications/user/$userId'),
        headers: {'token': token ?? ''},
      );
      if (mounted) {
        setState(() => _loading = false);
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          setState(() => _applications = data['applications'] ?? []);
        } else {
          setState(() => _error = 'Failed to load leave applications');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'Error: $e';
        });
      }
    }
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      default:
        return Colors.orange;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Leave Status'),
        backgroundColor: Colors.green.shade800,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loading ? null : _loadUserAndLeave,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton(onPressed: _loadUserAndLeave, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : _applications.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.event_busy, size: 64, color: Colors.grey.shade400),
                          const SizedBox(height: 16),
                          Text('No leave applications yet', style: TextStyle(color: Colors.grey.shade600)),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () => Navigator.of(context).pushNamed('/apply-leave').then((_) => _loadUserAndLeave()),
                            child: const Text('Apply for leave'),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadUserAndLeave,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _applications.length,
                        itemBuilder: (context, i) {
                          final a = _applications[i];
                          final status = (a['status'] ?? 'pending').toString();
                          final start = a['startDate'] != null ? DateTime.tryParse(a['startDate'].toString()) : null;
                          final end = a['endDate'] != null ? DateTime.tryParse(a['endDate'].toString()) : null;
                          final applied = a['appliedDate'] != null ? DateTime.tryParse(a['appliedDate'].toString()) : null;
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: _statusColor(status).withOpacity(0.2),
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: _statusColor(status)),
                                        ),
                                        child: Text(status.toUpperCase(), style: TextStyle(color: _statusColor(status), fontWeight: FontWeight.w600)),
                                      ),
                                      const Spacer(),
                                      Text(a['leaveType'] ?? '—', style: TextStyle(color: Colors.grey.shade700)),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Text('Reason: ${a['reason'] ?? '—'}', style: const TextStyle(fontWeight: FontWeight.w500)),
                                  const SizedBox(height: 6),
                                  Text(
                                    '${start != null ? "${start.day}/${start.month}/${start.year}" : "—"} to ${end != null ? "${end.day}/${end.month}/${end.year}" : "—"}',
                                    style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                                  ),
                                  if (applied != null)
                                    Text('Applied: ${applied.day}/${applied.month}/${applied.year}', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
