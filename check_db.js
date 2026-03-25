import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cnbclgdhokezckgaoteb.supabase.co',
  'sb_publishable_c3rPY_d-8dP34XMIcS_kpQ_YMiHf_l-'
);

async function check() {
  let allData = [];
  let from = 0;
  const step = 1000;
  while(true) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .range(from, from + step - 1);
    if (error) throw error;
    if (data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < step) break;
    from += step;
  }
  console.log('Paginated rows fetched:', allData.length);


  const { data: accounts } = await supabase.from('accounts').select('*');
  console.log('Accounts:', accounts);
}
check();
