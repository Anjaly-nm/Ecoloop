import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';

const String apiBaseUrl = 'https://ecoloop-psi.vercel.app';

class ApplyLeavePage extends StatefulWidget {
  const ApplyLeavePage({super.key});

  @override
  State<ApplyLeavePage> createState() => _ApplyLeavePageState();
}

class _ApplyLeavePageState extends State<ApplyLeavePage> {
  final _formKey = GlobalKey<FormState>();
  final _startController = TextEditingController();
  final _endController = TextEditingController();
  final _reasonController = TextEditingController();

  String _leaveType = 'Personal';
  File? _attachment;
  String? _userId;
  bool _isSubmitting = false;
  String? _errorMsg;

  static const List<String> leaveTypes = ['Personal', 'Medical', 'Emergency', 'Vacation', 'Other'];

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      final user = jsonDecode(userStr) as Map<String, dynamic>;
      setState(() => _userId = user['id']?.toString());
    }
  }

  Future<void> _pickDateStart() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) _startController.text = date.toIso8601String().split('T')[0];
  }

  Future<void> _pickDateEnd() async {
    final first = DateTime.tryParse(_startController.text) ?? DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: first,
      firstDate: first,
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) _endController.text = date.toIso8601String().split('T')[0];
  }

  Future<void> _pickAttachment() async {
    final picker = ImagePicker();
    final x = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (x != null) setState(() => _attachment = File(x.path));
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_userId == null) {
      setState(() => _errorMsg = 'User not found. Please log in again.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMsg = null;
    });

    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$apiBaseUrl/api/leave-applications'),
    );
    request.fields['startDate'] = _startController.text.trim();
    request.fields['endDate'] = _endController.text.trim();
    request.fields['leaveType'] = _leaveType;
    request.fields['reason'] = _reasonController.text.trim();
    request.fields['userId'] = _userId!;

    if (_attachment != null) {
      request.files.add(await http.MultipartFile.fromPath('attachment', _attachment!.path));
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token != null) request.headers['token'] = token;

      final streamed = await request.send();
      final response = await http.Response.fromStream(streamed);
      final data = jsonDecode(response.body) as Map<String, dynamic>?;

      if (mounted) {
        setState(() => _isSubmitting = false);
        if (response.statusCode >= 200 && response.statusCode < 300) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(data?['message'] ?? 'Leave applied successfully')),
          );
          Navigator.of(context).pop(true);
        } else {
          setState(() => _errorMsg = data?['message']?.toString() ?? 'Failed to submit leave');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _errorMsg = 'Error: $e';
        });
      }
    }
  }

  @override
  void dispose() {
    _startController.dispose();
    _endController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Apply Leave'),
        backgroundColor: Colors.green.shade800,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Start Date', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _startController,
                readOnly: true,
                onTap: _pickDateStart,
                decoration: const InputDecoration(
                  hintText: 'Select start date',
                  border: OutlineInputBorder(),
                  suffixIcon: Icon(Icons.calendar_today),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              const Text('End Date', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _endController,
                readOnly: true,
                onTap: _pickDateEnd,
                decoration: const InputDecoration(
                  hintText: 'Select end date',
                  border: OutlineInputBorder(),
                  suffixIcon: Icon(Icons.calendar_today),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              const Text('Leave Type', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _leaveType,
                decoration: const InputDecoration(border: OutlineInputBorder()),
                items: leaveTypes.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                onChanged: (v) => setState(() => _leaveType = v ?? 'Personal'),
              ),
              const SizedBox(height: 16),
              const Text('Reason', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _reasonController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Enter reason for leave',
                  border: OutlineInputBorder(),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              const Text('Attachment (optional)', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              OutlinedButton.icon(
                onPressed: _pickAttachment,
                icon: const Icon(Icons.attach_file),
                label: Text(_attachment == null ? 'Choose file' : 'Selected: ${_attachment!.path.split(RegExp(r'[/\\]')).last}'),
              ),
              if (_errorMsg != null) ...[
                const SizedBox(height: 12),
                Text(_errorMsg!, style: const TextStyle(color: Colors.red)),
              ],
              const SizedBox(height: 24),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green.shade700),
                  child: _isSubmitting
                      ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Submit Leave Application'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
