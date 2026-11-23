// Fixed, non-private samples; sent only by an explicit --smoke invocation.
module.exports={
 javascript:{code:"const fs=require('node:fs');const [a,b]=fs.readFileSync(0,'utf8').trim().split(/\\s+/).map(Number);console.log(a+b);",stdin:'2 3\n'},
 python:{code:'import sys\na,b=map(int,sys.stdin.read().split())\nprint(a+b)\n',stdin:'2 3\n'},
 java:{code:'import java.util.Scanner; public class Main { public static void main(String[] args) { Scanner s=new Scanner(System.in); long a=s.nextLong(),b=s.nextLong(); System.out.println(a+b); } }',stdin:'2 3\n'},
 c:{code:'#include <stdio.h>\nint main(void){long long a,b;if(scanf("%lld %lld",&a,&b)!=2)return 1;printf("%lld\\n",a+b);return 0;}\n',stdin:'2 3\n'},
 'c++':{code:'#include <iostream>\nint main(){long long a,b;if(!(std::cin>>a>>b))return 1;std::cout<<a+b<<"\\n";return 0;}\n',stdin:'2 3\n'},
};
